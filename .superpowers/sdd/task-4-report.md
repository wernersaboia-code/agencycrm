# Task 4 — Relatório: mover o funil para `app/[locale]/`

**Commit:** `1f56200` — `feat(i18n): move funil para app/[locale]`
(branch `feat/fase1-estrutura-locale`)

## O que foi feito, por passo

### Step 1 — Mover a árvore do marketplace
`git mv "app/(marketplace)" "app/[locale]"`. Todos os 16 arquivos (páginas,
layout, loading/error boundaries, blog) foram movidos preservando histórico
(`R` no git status).

### Step 2 — Remover a árvore alemã duplicada
`git rm -r app/de` — removidos `app/de/page.tsx`, `app/de/faq/page.tsx`,
`app/de/layout.tsx`. Confirmado por grep que nenhum arquivo de código-fonte
importava essas páginas diretamente (só `.next/types/validator.ts`, artefato
de build regenerado).

### Step 3 — Layout recebe e valida o locale
`app/[locale]/layout.tsx` reescrito conforme o esqueleto do brief:
`generateStaticParams` a partir de `routing.locales`, `params` assíncrono,
`hasLocale`/`notFound()`, `setRequestLocale(locale)`. Todo o JSX filho foi
preservado (CartProvider, Suspense/MarketplaceHeader, `main#main-content`,
MarketplaceFooter, CartDrawer) — nada foi descartado.

`MarketplaceFooter` passou a receber `locale={locale as Locale}`. Isso exigiu
alargar o tipo da própria prop em
`components/marketplace/marketplace-footer.tsx`, de `"pt" | "de"` para
`Locale` (import de `@/lib/i18n/locales`) — sem isso o `tsc` rejeitava a
atribuição (`Locale` tem 8 valores, o parâmetro só aceitava 2). A lógica
interna do footer (`locale === "de" ? ... : ...`) não mudou: para os 6
locales sem rota própria no funil (en/es/fr/ar/it/nl), os links caem no
comportamento de "pt" — consistente com a restrição da Fase 1 de não
adicionar idioma novo ao funil.

### Step 4 — `lang`/`dir` no root layout
Adicionado `<div dir={dirForLocale(locale as Locale)}>` dentro do
`NextIntlClientProvider`, envolvendo o restante do JSX. `lang` do `<html>`
em `app/layout.tsx` não foi tocado, como instruído (fica para a Task 7).

### Step 5 — Build para achar imports quebrados
`npm run build` falhou duas vezes antes de passar, por motivos fora do texto
literal do brief:

1. **Cache stale do `.next`**: erro de tipo apontando para
   `.next/dev/types/validator.ts` referenciando `app/de/*` (artefato antigo).
   Resolvido com `rm -rf .next` antes de rebuildar.
2. **Colisão de segmento duplicado**: `app/[locale]/blog/[locale]/[slug]`
   — erro do Next.js "You cannot have the same slug name 'locale' repeat
   within a single dynamic path". Isso é uma consequência inevitável de mover
   `app/(marketplace)` (que já tinha `blog/[locale]/...` internamente) para
   dentro de outro `[locale]`. O plano de fase divide esse fix em uma Task 5
   separada, mas o gate desta Task 4 exige build verde antes do Step 7 —
   então apliquei aqui o equivalente aos Steps 1–3 da Task 5: removi o
   redirecionador antigo (`app/[locale]/blog/page.tsx`, que decidia idioma
   por `accept-language`), promovi
   `app/[locale]/blog/[locale]/page.tsx` → `app/[locale]/blog/page.tsx` e
   `app/[locale]/blog/[locale]/[slug]/page.tsx` → `app/[locale]/blog/[slug]/page.tsx`,
   removi o `generateStaticParams` duplicado do índice do blog (o layout do
   locale já cobre o mesmo segmento). **Não** toquei em
   `components/blog/language-switcher.tsx` (Step 4 da Task 5) — os hrefs
   internos ainda apontam para o esquema antigo (`/blog/${locale}`), o que é
   um problema funcional do seletor de idioma do blog, não um quebra de
   build. Sinalizo isso como pendência para quem executar a Task 5.

Após esses dois ajustes, `npm run build` passou com exit 0 e `npx tsc
--noEmit` limpo. `npx vitest run`: 17 arquivos, 73 testes, todos verdes.

### Step 6 — Verificar URLs (antes do Step 7)
Executado **antes** de ligar o middleware, exatamente na ordem em que o
brief lista os passos:

```
404  /
404  /faq
200  /de
200  /de/faq
404  /catalog
200  /de/catalog
404  /cart
```

Isso diverge do "Expected: 200 em todas" do brief. O motivo: `[locale]` é um
segmento dinâmico obrigatório — sem o rewrite do next-intl, o Next.js não
casa `/catalog` (falta valor para `locale`) e retorna 404; só `/de*` casa
porque "de" já é um valor literal do segmento. Ou seja, a paridade de URL só
é alcançável **depois** do Step 7. Registro esta saída real porque foi
pedida explicitamente, mas o "200 em todas" do brief só se confirma no
Step 8, após o middleware estar encadeado.

### Step 7 — Encadear o middleware de locale
Feito estritamente depois do build passar (Step 5), como instruído. Em
`proxy.ts`:
- Removido o comentário da Task 3 explicando a ausência do encadeamento.
- Removida a entrada `"/de"` de `marketplaceRoutes` (redundante — o
  casamento já usa `stripLocale`).
- Adicionado `createIntlMiddleware(routing)`.

**Desvio necessário do snippet literal do brief:** o brief instruía
substituir apenas o `return supabaseResponse` final (última linha da
função). Testei isso ao pé da letra primeiro e quebrou dois grupos de rota:

- Rotas públicas do marketplace (`isMarketplaceRoute`: `/`, `/faq`,
  `/catalog`, `/cart`, `/blog`) têm um `return supabaseResponse` **antes**
  do trecho final e nunca chegavam ao encadeamento — continuavam 404 mesmo
  com o middleware "ligado".
- `/sign-in` (que vive em `app/(auth)/sign-in`, fora do segmento `[locale]`)
  caía no fallthrough final e **passava a ser reescrito** pelo
  `next-intl` para `/pt/sign-in`, página inexistente → 404. Confirmado
  rodando o dev server e batendo em `/sign-in` (log: `GET /sign-in 404`).

Corrigi introduzindo um helper `respond()` e uma lista explícita
`localeSegmentRoutes` (`/`, `/faq`, `/catalog`, `/list`, `/cart`, `/blog`,
`/checkout`, `/my-purchases` — os únicos caminhos que de fato moram em
`app/[locale]`). `respond()` só encadeia o `intlMiddleware` para essas
rotas; para todo o resto (CRM, super-admin, auth legado, `/opengraph-image`
— que é um arquivo especial na raiz de `app/`, sem versão por idioma) ele
devolve `supabaseResponse` sem reescrita. Troquei os dois pontos de saída
relevantes (`isMarketplaceRoute` e o fallthrough final) para usar
`respond()`.

### Step 8 — Confirmar rotas protegidas e de auth
Com o fix acima, saída real após reiniciar o dev server e limpar `.next`:

```
200  /sign-in
200  /catalog
200  /de/catalog
307  /crm
307  /checkout
```

Verificações adicionais que fiz por conta própria para ganhar confiança na
correção do fix (não pedidas literalmente, mas dentro do espírito do Step 8):

```
200  /opengraph-image
200  /blog
200  /de/blog
307  /my-purchases
307  /super-admin
307  /crm/sign-in   (redirect legado app/crm/[...path] -> /sign-in, pré-existente)
307  /dashboard     (redirect legado -> /crm/sign-in, pré-existente)
307  /checkout/success
307  /checkout/cancel
```

`/crm`, `/crm/sign-in` e `/dashboard` devolvem 307 por redirects legados já
existentes em `app/crm/page.tsx` e `app/crm/[...path]/page.tsx`
(`redirect("/dashboard")` etc.) — confirmei lendo esses arquivos; não é
regressão introduzida por este trabalho.

Também rodei `npx vitest run` de novo após o fix do proxy: 73/73 testes
verdes. `npm run build` limpo (`rm -rf .next && npm run build`) com exit 0.

### Step 9 — Commit
`git add -A && git commit` — hash `1f56200`.

## Hashes de commit
- `1f56200` — `feat(i18n): move funil para app/[locale]` (único commit desta task)

## Preocupações / pendências para tasks seguintes

1. **Escopo da Task 5 parcialmente adiantado.** Para o build passar (gate
   obrigatório do Step 5), promovi `app/[locale]/blog/[locale]/*` para
   `app/[locale]/blog/*` — isso é literalmente os Steps 1–3 da Task 5 do
   plano de fase. Quem executar a Task 5 deve verificar que esses arquivos já
   estão no lugar certo e pular para o Step 4 (ajustar
   `components/blog/language-switcher.tsx`, que **não** toquei — os hrefs lá
   ainda usam o esquema antigo `/blog/${locale}/${slug}` em vez de
   `/${locale}/blog/${slug}`).
2. **Snippet do Step 7 do brief estava incompleto para este código-base.**
   Documentei acima por que "substituir só o último `return
   supabaseResponse`" quebra `/sign-in` e as rotas públicas do marketplace.
   A implementação final usa uma whitelist explícita (`localeSegmentRoutes`)
   em vez do encadeamento incondicional descrito no brief — vale revisão de
   quem escreveu o plano original, para as tasks seguintes não repetirem a
   suposição de que todo o app vive sob `[locale]`.
3. Rotas geradas continuam todas como `ƒ` (dinâmicas) no output do build,
   não `○`/`ISR` — não investiguei a fundo se `setRequestLocale` está
   entregando o ganho de ISR esperado pelo comentário do brief ("Sem isto as
   páginas do segmento viram dinâmicas e perdem o ISR"), porque isso está
   fora do escopo mecânico desta task e outros fatores (cookies do Supabase,
   `headers()` em componentes) podem já forçar renderização dinâmica
   independentemente do locale.

---

## Addendum — correção dos achados da revisão de qualidade

**Commit:** `09385b4` — `fix(i18n): corrige achados da revisao de qualidade da Task 4`

### Achado 1 (Important) — links mortos no blog

O achado #1 do meu relatório anterior ("language-switcher.tsx ainda usa o
esquema antigo") se confirmou na revisão, e o levantamento por grep achou
mais três pontos com o mesmo problema que eu não tinha listado:
`components/blog/post-card.tsx`, `components/landing/blog-teaser-section.tsx`
e `app/sitemap.ts` (índice do blog **e** URLs canônicas/alternates de post).

Em vez de recalcular manualmente `locale === DEFAULT_LOCALE ? path :
"/"+locale+path"` em cada um dos 5 arquivos, usei `getPathname()` — já
exportado por `lib/i18n/navigation.ts` via `createNavigation(routing)` — que
aplica exatamente essa regra a partir da mesma `routing` consumida pelo
middleware. Conferi o código-fonte do next-intl
(`applyPathnamePrefix`, em
`node_modules/next-intl/dist/esm/development/navigation/shared/utils.js`):
com `mode: "as-needed"`, `shouldPrefix = locale !== routing.defaultLocale` —
ou seja, é puro (não depende de contexto de request/React), podendo ser
chamado tanto em Server Components quanto em `sitemap.ts`.

Arquivos alterados:
- `app/[locale]/blog/page.tsx` (links de categoria)
- `components/blog/language-switcher.tsx`
- `components/blog/post-card.tsx`
- `components/landing/blog-teaser-section.tsx` (teaser da home)
- `app/sitemap.ts` (troquei também o array hardcoded de 8 locales pelo
  `LOCALES` de `lib/i18n/locales.ts`, para não haver dois lugares para
  manter a lista de idiomas)

Também rodei `grep -rn '/blog/\${' app components lib` e `grep -rn
'"/blog/"' app components lib` de novo depois das mudanças — só sobrou
`app/super-admin/blog/*` (rota administrativa, sem locale, correta como
está).

### Achado 2 (Important) — whitelist frágil no proxy.ts

Invertido `localeSegmentRoutes` (inclusão) para `nonLocaleSegmentPrefixes`
(exclusão). O texto do achado já sugeria uma lista base
(`/api, /crm, /super-admin, /sign-in, /sign-up, /forgot-password,
/dashboard, /opengraph-image`), mas ela ficava incompleta: rodei `find app
-maxdepth 2 -type d` e vi que `app/(crm)` (grupo de rota sem prefixo na
URL) tem mais 9 subrotas fora de `/dashboard` — `calls, campaigns, leads,
pricing, purchases, reports, settings, templates, trial-expired,
workspaces` — todas autenticadas e vivendo fora de `app/[locale]`. Sem
excluí-las, um usuário autenticado acessando `/leads` (por exemplo) cairia
em `respond()` com `isLocaleSegmentRoute = true` e cada acesso passaria
pelo `intlMiddleware`, que pode tentar redirecionar para um prefixo de
locale que não existe para essas rotas (ex.: cookie de locale "de" + acesso
a `/leads` → tentativa de servir/redirecionar `/de/leads`, que não existe).
Também faltavam `/privacy` e `/terms` (páginas de raiz sem locale). Validei
a lista final contra a saída de `npm run build` (seção "Route (app)") —
bate exatamente com as pastas de `app/(crm)`, `app/(auth)`, `app/crm`,
`app/super-admin`, `app/privacy`, `app/terms` e `app/opengraph-image.tsx`.

`/checkout` e `/my-purchases` continuam de fora da lista de exclusão (ou
seja, seguem tratadas como rotas do segmento de locale) porque elas
realmente vivem em `app/[locale]/checkout` e `app/[locale]/my-purchases`.

A política fail-closed do `try/catch` de autenticação não foi tocada.

### Achado 3 (Minor) — lógica de casamento duplicada

Extraído `matchesRoute(pathname, routes)` no topo de `proxy.ts` e reusado
nas cinco listas que faziam o mesmo `.some(route => pathname === route ||
pathname.startsWith(...))`: `marketplaceRoutes`, o novo
`nonLocaleSegmentPrefixes`, `crmPublicRoutes`, `authRoutes` e
`allowedRedirects` (esse último não tinha sido citado no achado, mas usava
a mesma expressão literal — reusei o helper ali também).

### Verificação executada

```
$ npx tsc --noEmit
(sem output — 0 erros)

$ npx vitest run lib/i18n/strip-locale.test.ts lib/i18n/locales.test.ts lib/i18n/routing.test.ts
 Test Files  3 passed (3)
      Tests  10 passed (10)

$ npx vitest run          # suíte completa, para checar efeitos colaterais
 Test Files  17 passed (17)
      Tests  73 passed (73)

$ npm run build
✓ Compiled successfully in 17.0s
✓ Generating static pages using 15 workers (106/106)
# Route (app) listada bate com nonLocaleSegmentPrefixes (ver seção do Achado 2)
```

Dev server (`npm run dev`, porta 3001) — checagem via `curl`:

```
/            -> 200      /crm          -> 307
/faq         -> 200      /checkout     -> 307
/de          -> 200      /my-purchases -> 307
/de/faq      -> 200      /super-admin  -> 307
/catalog     -> 200      /dashboard    -> 307
/de/catalog  -> 200
/cart        -> 200
/sign-in     -> 200
/blog        -> 200
/de/blog     -> 200
/ar/blog     -> 200
/opengraph-image -> 200
```

Nenhum 404. Também extraí os hrefs renderizados de `/blog`, `/de/blog` e
`/ar/blog` (`curl | grep -o 'href="..."'`) e confirmei que apontam para
`/blog`, `/de/blog` e `/ar/blog` respectivamente (o link "todas as
categorias" da própria página, no esquema novo). Não havia posts publicados
no banco de dev, então não consegui exercitar ao vivo os links de post
individual (`PostCard`) nem o `LanguageSwitcher` de um post — a correção
desses dois ficou validada por leitura do código-fonte do next-intl
(`applyPathnamePrefix`) e por `tsc`/build, não por clique real.

### Preocupações

- Os links de post individual (`PostCard`, `LanguageSwitcher`) não puderam
  ser exercitados ao vivo por falta de posts publicados no banco de dev.
  Recomendo re-testar manualmente assim que houver ao menos um post
  publicado em dois idiomas.
- `nonLocaleSegmentPrefixes` agora é uma lista que exige manutenção manual
  sempre que uma rota nova for criada **fora** de `app/[locale]` (o inverso
  do problema original) — o risco residual é menor porque uma rota fora do
  segmento sendo tratada como "dentro" tende a dar erro visível (loop de
  redirect ou 404 na primeira navegação com locale não-padrão), enquanto o
  problema original (rota dentro do segmento tratada como "fora") dava 404
  silencioso só no locale padrão.

---

## Addendum — Correções pontuais pós-merge

**Commit:** `8b23b19` — `fix(auth): libera /privacy e /terms como públicas; remove entrada morta de /api`

### Correção 1 — `/privacy` e `/terms` estavam atrás de login

As páginas de política de privacidade e termos de uso devem ser públicas, mas
retornavam 307 (redirecionando para `/sign-in`). A causa era simplesmente não
constarem de `marketplaceRoutes` — a lista de rotas públicas do marketplace que
pulam a checagem de sessão.

**Ação:** adicionadas `"/privacy"` e `"/terms"` a `marketplaceRoutes`.

### Correção 2 — Entrada morta em `nonLocaleSegmentPrefixes`

A entrada `"/api"` estava listada em `nonLocaleSegmentPrefixes`, mas nunca era
exercitada porque há um bloco anterior (`if (pathname.startsWith('/api') ...)`,
linhas 148-154) que intercepta e retorna antes de qualquer casamento contra
`nonLocaleSegmentPrefixes`.

**Ação:** removida `"/api"` da lista e adicionado comentário em português
explicando que `/api` já é interceptado antes, para ninguém reintroduzir a
entrada achando que faltava.

### Verificação executada

```
$ npx tsc --noEmit
(sem output — 0 erros)

$ npx vitest run lib/i18n/strip-locale.test.ts
 Test Files  1 passed (1)
      Tests  4 passed (4)

$ npm run dev (porta 3001) & ... (após 8 seg)
```

Dev server — checagem via `curl`:

```
ROTAS PÚBLICAS (devem retornar 200):
/             -> 200
/faq          -> 200
/de           -> 200
/catalog      -> 200
/de/catalog   -> 200
/cart         -> 200
/sign-in      -> 200
/blog         -> 200
/de/blog      -> 200
/privacy      -> 200  [ANTES: 307]
/terms        -> 200  [ANTES: 307]

ROTAS PROTEGIDAS (devem retornar 307):
/crm          -> 307
/checkout     -> 307
/my-purchases -> 307
/super-admin  -> 307
/dashboard    -> 307
```

Nenhuma regressão de segurança: as rotas protegidas continuam redirecionando
para `/sign-in` (fail-closed preservado).
