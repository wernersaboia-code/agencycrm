# Task 8 — Relatório: correção da regressão Critical (locale fixo em `pt`)

## O bug

Na fusão de `app/de/page.tsx` / `app/de/faq/page.tsx` para
`app/[locale]/page.tsx` / `app/[locale]/faq/page.tsx` (Task 4), a versão
portuguesa sobreviveu e o `locale` passado às seções da landing e ao
`getTranslations` dos metadados ficou hardcoded em `"pt"`, ignorando o
locale real da rota. Resultado: `/de` e `/de/faq` renderizavam em
português — só `/de/catalog` continuava correto porque usa
`getTranslations("catalog")` sem forçar locale. Isso já tinha sido
registrado como limitação conhecida na "Preocupação 2" do
`task-8-report.md`, mas nesta rodada foi tratado como regressão a
corrigir de fato.

## O que foi feito

### `components/landing/types.ts`
Adicionada a função `toLandingLocale(locale: string): LandingLocale`,
que mapeia o locale da rota (8 valores possíveis) para o subconjunto
`"pt" | "de"` que a landing hoje sabe renderizar: `de` continua `de`,
qualquer outro cai em `pt`. Comentário em português explica que é
temporário até a fase 3 trazer as demais traduções — o mesmo padrão já
usado em `i18n/request.ts` (`messagesLocale`), agora extraído para reuso.
`LandingLocale` **não** foi alargado — segue restrito a `"pt" | "de"`
como pedido.

### `app/[locale]/page.tsx`
- `generateMetadata`: `getTranslations({ locale: "pt", ... })` →
  `getTranslations({ locale, ... })`, usando o locale da rota diretamente
  (o `i18n/request.ts` já faz o fallback de mensagens).
- `EasyProspectHome` passou a ser `async`, recebe `params`, extrai
  `routeLocale` e calcula `const locale = toLandingLocale(routeLocale)`.
  As onze seções (`HeroSection`, `IntroSection`, `TargetMarketsSection`,
  `BuyerProfilesSection`, `DeliverablesSection`, `DataQualitySection`,
  `AdvantageSection`, `HowItWorksSection`, `StatsSection`,
  `BlogTeaserSection`, `FinalCtaSection`) agora recebem `locale={locale}`
  em vez de `locale="pt"` fixo.
- Não toquei em `openGraph.locale: "pt_BR"` hardcoded nem em
  `alternates` — fora do escopo definido (que listava só a linha do
  `getTranslations` e as onze seções).

### `app/[locale]/faq/page.tsx`
- Mesmo ajuste em `generateMetadata` (`getTranslations({ locale, ... })`).
- `FaqPage` virou `async`, extrai `locale` de `params` e passa
  `<FaqPageContent locale={toLandingLocale(locale)} />` em vez de
  `locale="pt"` fixo. Não havia outros pontos com locale fixo neste
  arquivo.

## Verificação executada

```
$ npx tsc --noEmit
(sem output — 0 erros)

$ npx vitest run
 Test Files  16 passed (16)
      Tests  70 passed (70)

$ npm run lint
✖ 5 problems (0 errors, 5 warnings)
```
Os mesmos 5 warnings pré-existentes (imagens `<img>` e o hook
`react-hooks/incompatible-library` em `faq-contact-form.tsx`) — baseline
preservada, 0 erros novos.

```
$ npm run build
✓ Compiled successfully in 15.6s
✓ Generating static pages using 15 workers (106/106)
```
(Antes do build, matei os processos `node.exe` remanescentes com
`taskkill //F //IM node.exe` — sem isso o `prisma generate` dava EPERM
ao renomear a DLL da query engine no Windows, como já registrado na
memória do ambiente.)

Dev server na porta 3001:

```
$ curl -s localhost:3001/de | grep -oE '<h1[^>]*>[^<]{0,80}'
<h1 ...>Qualifizierte Importeur- und Distributorenlisten für Ihren internationalen Vert

$ curl -s localhost:3001/ | grep -oE '<h1[^>]*>[^<]{0,80}'
<h1 ...>Listas qualificadas de importadores e distribuidores para o seu comércio intern

$ curl -s localhost:3001/de/faq | grep -oE '<h1[^>]*>[^<]{0,60}'
<h1 ...>Häufige Fragen

$ curl -s localhost:3001/faq | grep -oE '<h1[^>]*>[^<]{0,60}'
<h1 ...>Perguntas frequentes

$ curl -s localhost:3001/de | grep -oE '<title>[^<]*</title>'
<title>Qualifizierte Importeur- und Distributorenlisten für Ihren internationalen Vertrieb | Easy Prospect</title>

$ curl -s localhost:3001/en | grep -oE '<h1[^>]*>[^<]{0,80}'
<h1 ...>Listas qualificadas de importadores e distribuidores para o seu comércio intern
```
`/en` cai em português como esperado nesta fase (não é bug — só pt/de
têm tradução da landing).

Status codes:

```
200  /            200  /de           200  /catalog     200  /cart
200  /faq         200  /de/faq       200  /de/catalog  200  /blog
                                                         200  /de/blog
200  /privacy     200  /terms        200  /sign-in
307  /crm  /checkout  /my-purchases  /super-admin
```

Todos batem com o esperado.

## Commit

`fix(i18n): usa o locale da rota na landing e na FAQ em vez de "pt" fixo`
