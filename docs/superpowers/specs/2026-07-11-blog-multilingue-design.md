# Blog multilíngue — Design

**Data:** 2026-07-11
**Status:** Aprovado (aguardando revisão da spec)

## Objetivo

Criar um blog multilíngue para o Easy Prospect, gerenciado por um painel no
super-admin (banco de dados), substituindo a seção de teaser com posts
placeholder que hoje existe nas landings PT/DE.

## Idiomas

8 locales, definidos num único ponto de verdade:

`pt` · `de` · `en` · `es` · `fr` · `ar` · `it` · `nl`

- Apenas `ar` (árabe) é RTL — renderiza com `dir="rtl"`. Os demais são LTR.
- O modelo usa tabela de traduções por locale, então adicionar/remover idioma
  no futuro **não exige migração de schema** — só ajustar a lista de locales
  aceitos e o dicionário de rótulos.

## Decisões-chave

1. **Autoria:** painel no super-admin com dados no banco (Prisma). Reusa o
   `RichTextEditor` (Tiptap) existente.
2. **Roteamento (Opção A):** o blog carrega o idioma na URL —
   `/blog/[locale]/[slug]`. Independente do roteamento incompleto do site
   (que só tem PT na raiz e DE em `/de`). Slug por idioma para SEO.
3. **Moldura (limitação aceita na v1):** header/footer globais só existem em
   PT/DE. Posts em outros idiomas têm o *conteúdo* e os *rótulos do blog* no
   idioma certo, mas a moldura global permanece PT/DE até o site inteiro ser
   traduzido (fora de escopo).
4. **Recursos v1:** categorias/tags, imagem de destaque, rascunho/publicado +
   agendamento, SEO por post (meta/OG) e sitemap.

## Fonte única de locales

`lib/blog/locales.ts`:

```ts
export const BLOG_LOCALES = ["pt", "de", "en", "es", "fr", "ar", "it", "nl"] as const
export type BlogLocale = (typeof BLOG_LOCALES)[number]
export const RTL_BLOG_LOCALES: BlogLocale[] = ["ar"]
export const DEFAULT_BLOG_LOCALE: BlogLocale = "pt"
```

Usado por: schema (validação Zod), roteamento, seletor de idioma, hreflang e
dicionário de rótulos.

## Modelo de dados (Prisma)

### `BlogPost` — núcleo independente de idioma
- `id` (cuid)
- `coverImageUrl` String? — URL pública no bucket `blog`
- `status` enum `BlogPostStatus` (`DRAFT` | `PUBLISHED`), default `DRAFT`
- `publishedAt` DateTime? — data futura = agendado
- `authorId` → `User` (`onDelete: SetNull`, nullable, para não perder o post se
  o usuário sair)
- `categoryId` → `BlogCategory?` (`onDelete: Restrict`)
- `createdAt`, `updatedAt`
- `translations` BlogPostTranslation[]

### `BlogPostTranslation` — uma linha por idioma
- `id`, `postId` → `BlogPost` (`onDelete: Cascade`)
- `locale` String (validado contra `BLOG_LOCALES`)
- `title` String
- `slug` String
- `excerpt` String
- `contentHtml` String @db.Text — saída sanitizada do Tiptap
- `metaDescription` String?
- `ogImageUrl` String? — cai para `coverImageUrl` se ausente
- `createdAt`, `updatedAt`
- Únicos: `@@unique([postId, locale])` e `@@unique([locale, slug])`
- Índice: `@@index([locale])`

### `BlogCategory` + `BlogCategoryTranslation`
- `BlogCategory`: `id`, `key` String @unique (slug estável, ex.: `market-analysis`),
  `createdAt`, `updatedAt`, `posts` BlogPost[], `translations` BlogCategoryTranslation[]
- `BlogCategoryTranslation`: `id`, `categoryId` → `BlogCategory` (`onDelete: Cascade`),
  `locale`, `name`; `@@unique([categoryId, locale])`

### Regras de visibilidade (sem cron)
- Público quando `status = PUBLISHED` **e** `publishedAt <= now()`. A própria
  query revela o agendado quando a hora chega — nenhum job necessário.
- Índice de `/blog/[locale]` lista posts publicados que **têm tradução naquele
  locale**.
- Seletor de idioma num post mostra só os locales que aquele post possui.

### Migração
Aplicar via `prisma migrate` gerando o SQL e rodando direto (projeto sem shadow
DB — não resetar o banco).

## Painel super-admin

Segue o padrão existente (`app/super-admin/*` + `actions/admin/*` com
`requireAdmin` + Zod + `revalidatePath`).

### Páginas
- `/super-admin/blog` — lista: título (primeiro idioma disponível, ordem de
  preferência começando por PT), status, categoria, `publishedAt`, badges dos
  idiomas presentes (ex.: `PT DE EN`). Ações: novo, editar, excluir.
- `/super-admin/blog/new` e `/super-admin/blog/[id]` — editor:
  - Núcleo: upload de capa, categoria, status, `publishedAt` (permite agendar).
  - **Abas por idioma** (8): título, slug, resumo, conteúdo (`RichTextEditor`),
    meta description, OG opcional. Aba `ar` em RTL. Preenche só os idiomas
    desejados.
  - **Slug:** auto-gerado a partir do título de cada idioma (slugify), editável
    manualmente. Colisão de `(locale, slug)` → erro de validação amigável.
- `/super-admin/blog/categories` — CRUD de categorias com nome nos 8 idiomas.

### Regras de negócio
- **Publicar exige ≥1 idioma completo** (título + conteúdo não vazios). Tentar
  publicar sem nenhum idioma preenchido → erro de validação.
- Excluir categoria com posts é **bloqueado** (`RESTRICT`): reatribuir os posts
  antes.

### Server actions — `actions/admin/blog.ts`
`createPost`, `updatePost`, `deletePost`, `upsertTranslation`,
`deleteTranslation`, `createCategory`, `updateCategory`, `deleteCategory`.
Todas com `requireAdmin` e Zod validando os locales contra `BLOG_LOCALES`.
`contentHtml` sanitizado **no servidor** antes de persistir, reusando
`sanitizeHtmlForPreview` de `lib/utils/html-sanitizer.ts` (jsdom + dompurify,
allowlist já compatível com a saída do Tiptap). É um sanitizador server-side
genérico já existente — reusar em vez de criar outro (DRY).

### Upload de imagens
Bucket público `blog` no Supabase Storage, mesmo padrão de `lib/supabase/storage.ts`
(`uploadLogo`). Nova função `uploadBlogImage(file, postId)`. Validação de tipo
(PNG/JPG/WebP) e tamanho.

## Páginas públicas

As rotas ficam sob o grupo `app/(marketplace)/blog/*`, herdando header, footer e
carrinho do layout do marketplace (a moldura PT/DE já discutida).

- `/blog/[locale]` — índice: grid de cards (capa ou gradiente fallback,
  categoria, título, resumo, data), filtro por categoria, paginação. Só posts
  publicados com tradução no locale. `generateStaticParams` para os 8 locales.
- `/blog/[locale]/[slug]` — post: capa, título, data, categoria, conteúdo
  (RTL no `ar`), seletor de idioma (só idiomas do post), meta/OG.
  `generateMetadata` usa a tradução (title, metaDescription, ogImageUrl→cover).
- `/blog` — redireciona para `/blog/{detectado}` via `Accept-Language`,
  fallback `pt`.
- **RTL:** o container do conteúdo recebe `dir="rtl"` quando `locale === "ar"`.

### Dicionário de rótulos — `lib/blog/i18n.ts`
Strings de UI do blog (ex.: "Publicado em", "Todas as categorias", "Ler mais",
nomes dos idiomas) nos 8 locales. Decoupled do next-intl (que hoje só carrega
pt/de) para não desestabilizar o i18n global.

## Integrações

- **`BlogTeaserSection`** (`components/landing/blog-teaser-section.tsx`): passa a
  buscar os posts reais mais recentes do banco no locale da landing; cards viram
  links para `/blog/[locale]/[slug]`. Remove os placeholders de
  `messages/*.json` (`landing.blog.posts` / `_placeholder`). Se não houver posts
  publicados, a seção esconde o grid (ou mostra estado vazio discreto).
- **`proxy.ts`:** adicionar `/blog` às rotas públicas do marketplace.
- **`sitemap.ts`:** incluir URLs dos posts publicados com alternates `hreflang`
  entre as traduções de cada post; incluir os índices `/blog/[locale]`.

## Fora de escopo (v1 — YAGNI)
Comentários, RSS, busca no blog, e tradução da moldura global (header/footer)
além de PT/DE.

## Critérios de sucesso
- Admin cria/edita/publica/agenda posts em qualquer subconjunto dos 8 idiomas,
  com capa, categoria e SEO.
- Visitante acessa `/blog/[locale]` e `/blog/[locale]/[slug]` no idioma certo,
  com árabe em RTL, e navega entre traduções do mesmo post.
- Landing mostra posts reais e linka para o blog.
- Posts publicados aparecem no sitemap com hreflang.
- Agendamento respeitado sem job (revelado por query quando `publishedAt` chega).
