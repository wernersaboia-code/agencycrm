# Task 5 Report: BlogPosting schema nos posts do blog

## Implementado

- `lib/seo/schema.ts`: adicionado `buildBlogPostingSchema(input)` e a interface
  `BlogPostingSchemaInput`. Publisher aponta para a Organization por `@id`
  (sem `author` de pessoa física — comentário no código explica o porquê).
  `mainEntityOfPage` usa `${BASE_URL}/blog/${slug}`.
- `lib/seo/schema.test.ts`: adicionados os dois testes do brief para
  `buildBlogPostingSchema` (datas ISO + publisher; omissão de `image` sem
  capa).
- `app/[locale]/blog/[slug]/page.tsx`: renderiza `<JsonLd data={buildBlogPostingSchema({...})} />`
  logo após a guarda `if (!data) notFound()`, dentro de `if (post.publishedAt)`.

## TDD — evidência

- RED: `npm test -- seo/schema` → `TypeError: buildBlogPostingSchema is not a function`
  (2 testes falhando, 26 passando dos builders existentes).
- Implementação copiada/adaptada do brief (idêntica ao Step 3).
- GREEN: `npm test -- seo/schema` → 28/28 passando.

## Campos confirmados antes de usar (lidos direto do loader e do schema Prisma)

- `lib/blog/queries.ts` → `getPostBySlug`: retorna
  `{ post, translation, availableLocales, localeSlugs, categoryName }`.
  A guarda `if (post.status !== "PUBLISHED" || !post.publishedAt || post.publishedAt > now) return null`
  garante que, quando a página chega ao render, `post.publishedAt` já não é
  nulo nem futuro — mas o tipo Prisma (`publishedAt DateTime?`) continua
  nulável em TS, então mantive a checagem defensiva `if (post.publishedAt)`
  em vez de non-null assertion.
- `prisma/schema.prisma`:
  - `BlogPost`: `coverImageUrl String?`, `publishedAt DateTime?`,
    `updatedAt DateTime @updatedAt`.
  - `BlogPostTranslation`: `title String`, `slug String`, `excerpt String`,
    `metaDescription String?`, `ogImageUrl String?`.
- Mapeamento usado no page.tsx:
  - `title` → `translation.title`
  - `description` → `translation.metaDescription ?? translation.excerpt`
  - `slug` → `localeSlugs[locale] ?? slug` (slug do post no locale corrente,
    conforme instrução da task de usar o slug do locale atual em
    `mainEntityOfPage`)
  - `imageUrl` → `translation.ogImageUrl ?? post.coverImageUrl`
  - `publishedAt` → `post.publishedAt` (garantido não-nulo pela guarda acima)
  - `updatedAt` → `post.updatedAt` (do post, conforme pedido explicitamente
    no brief — não `translation.updatedAt`)

## publishedAt nulo — tratamento

Embora a query já filtre posts sem `publishedAt`, o tipo TS continua
`Date | null`. Envolvi o `<JsonLd>` em `if (post.publishedAt) { ... }` para
nunca chamar `buildBlogPostingSchema` com `publishedAt` ausente — evita
`new Date(null)` virar uma data inválida. `buildBlogPostingSchema` em si
aceita apenas `Date | string` (não opcional, conforme a interface do
brief), então essa validação fica inteiramente no call site da página.

## Verificação

- **Sem dev server** (instrução explícita da task): pulei o passo `curl`
  do brief.
- `npx tsc --noEmit` → sem erros.
- `npm run lint` → exit code 0; nenhum erro novo introduzido. O único aviso
  em `app/[locale]/blog/[slug]/page.tsx` é o já existente `@next/next/no-img-element`
  na tag `<img>` da capa do post, não relacionado a esta mudança. `lib/seo/schema.ts`
  não aparece no output do lint.
- `npm test` (suíte completa) → `Test Files 46 passed (46)`, `Tests 235 passed (235)`.

## Arquivos alterados

- `lib/seo/schema.ts`
- `lib/seo/schema.test.ts`
- `app/[locale]/blog/[slug]/page.tsx`

## Concerns

- Nenhum bloqueador. Ponto de atenção documentado: `updatedAt` vem de
  `post.updatedAt` (post inteiro), não de `translation.updatedAt` — se a
  intenção do produto for refletir a última edição do conteúdo específico
  do idioma, a fonte correta seria `translation.updatedAt`. Segui a
  redação literal do brief ("a updatedAt do post").

## Fix: URLs locale-aware

### Problema

`buildProductSchema` e `buildBlogPostingSchema` montavam URLs absolutas por
concatenacao de string (`${BASE_URL}/list/${slug}`, `${BASE_URL}/blog/${slug}`),
ignorando o prefixo de locale do next-intl (`localePrefix: "as-needed"`,
`defaultLocale: "pt"`). Para os 7 locales nao-default (de, en, es, fr, it, nl,
ar) a URL emitida no JSON-LD nao tinha o prefixo de idioma e apontava para a
pagina errada (404 ou outro locale).

### Fix

Ambos os builders agora usam `getPathname` de `@/lib/i18n/navigation`
(mesmo mecanismo ja usado em `lib/i18n/alternates.ts` e `app/sitemap.ts`),
construindo a URL como `${BASE_URL}${getPathname({ href: "/list/<slug>", locale })}`
e o equivalente para `/blog/<slug>`. Os builders continuam puros — `getPathname`
e uma funcao pura do next-intl.

### TDD

RED (`npm test -- seo/schema`), 2 testes falhando antes do fix:

```
 FAIL  lib/seo/schema.test.ts > buildProductSchema > de: url e offer.url levam o prefixo /de
 Expected: "https://www.easyprospect.com.br/de/list/importadores-cafe-alemanha"
 Received: "https://www.easyprospect.com.br/list/importadores-cafe-alemanha"

 FAIL  lib/seo/schema.test.ts > buildBlogPostingSchema > de: mainEntityOfPage leva o prefixo /de
 Expected: "https://www.easyprospect.com.br/de/blog/como-escolher-importador"
 Received: "https://www.easyprospect.com.br/blog/como-escolher-importador"

 Test Files  1 failed (1)
      Tests  2 failed | 30 passed (32)
```

GREEN (`npm test -- seo/schema`):

```
 Test Files  1 passed (1)
      Tests  32 passed (32)
```

Suite completa (`npm test`): 46 arquivos, 239 testes, todos passando.

### tsc

`npx tsc --noEmit`: sem saida, limpo.
