# Task 6 (rodada 3) — Relatório: varredura completa + trava de ESLint contra perda de locale

## Contexto

Duas rodadas anteriores (`52320b0` e `540b6b2` / relatório em
`task-6-report.md`) já tinham trocado `Link`/`useRouter`/`redirect` de
`next/link`/`next/navigation` pelo wrapper de `lib/i18n/navigation.ts` em
`components/` e em `app/[locale]/`, mas ambas trabalharam a partir de listas
de ocorrências pontuais. Ficou de fora o `useRouter` de `next/navigation` em
componentes-filhos client de `components/marketplace/` e
`components/checkout/` — a classe de bug que esta rodada fecha, mais uma
trava de lint para impedir que ela volte.

## Parte 1 — Varredura completa

Rodei os quatro `grep` sugeridos no brief sobre `components/` e
`app/[locale]/` inteiros (não só nos arquivos já listados) e revisei cada
ocorrência:

```
grep -rn 'from "next/navigation"' components/ app/[locale]/
grep -rn 'router\.push\|router\.replace\|redirect(' components/ app/[locale]/
grep -rnE '(href|action)=("|\{`)/(catalog|cart|checkout|list|my-purchases|faq|blog)' components/ app/[locale]/
grep -rn 'window.location' components/ app/[locale]/
```

Também rodei greps complementares (`<a\s+href=`, `.push(`, `.replace(`) para
garantir que nenhuma forma alternativa de navegação escapasse dos quatro
padrões do brief. `window.location` não aparece em nenhum lugar do projeto
dentro desses diretórios.

### Tabela de ocorrências avaliadas

| # | Arquivo | Ocorrência | Onde é renderizado | Decisão |
|---|---|---|---|---|
| 1 | `components/checkout/paypal-buttons.tsx` | `router.push(\`/checkout/success?purchaseId=...\`)` (~119) | `app/[locale]/checkout/page.tsx` | **Corrigido** — wrapper (`/checkout/success` é dentro do segmento) |
| 2 | `components/checkout/paypal-buttons.tsx` | `router.push("/checkout/cancel")` (~143, `onCancel`) | idem | **Corrigido** — wrapper (dentro do segmento) |
| 3 | `components/checkout/paypal-buttons.tsx` | `router.push("/sign-in?redirect=/checkout")` (~93) | idem | **Mantido puro** — `/sign-in` é fora do segmento; agora explícito com `usePlainRouter` |
| 4 | `components/checkout/paypal-buttons.tsx` | `router.push("/sign-in?redirect=/my-purchases")` (~125) | idem | **Mantido puro** — mesmo motivo |
| 5 | `components/marketplace/buy-now-button.tsx` | `router.push(isAuthenticated ? "/checkout" : "/sign-in?...")` (~40) | `app/[locale]/list/[slug]/page.tsx` | **Corrigido** — ramo `/checkout` passou a usar o wrapper; ramo `/sign-in` passou a usar `usePlainRouter` (import separado). Caso misto: a mesma chamada saltava para uma rota dentro e outra fora do segmento |
| 6 | `components/marketplace/catalog-search.tsx` | `router.push(\`/catalog?${params}\`)` (~38) | `app/[locale]/catalog/page.tsx` | **Corrigido** — wrapper |
| 7 | `components/marketplace/catalog-sidebar.tsx` | `updateFilters`: `router.push(\`/catalog?${params}\`)` (~99) | `components/marketplace/catalog-filters-panel.tsx` → `app/[locale]/catalog/page.tsx` | **Corrigido** — wrapper |
| 8 | `components/marketplace/catalog-sidebar.tsx` | `clearFilters`: `router.push("/catalog")` (~125) | idem | **Corrigido** — wrapper |
| 9 | `components/marketplace/my-purchases-empty-state.tsx` | `router.push("/catalog")` (~19) | `app/[locale]/my-purchases/page.tsx` | **Corrigido** — wrapper |
| — | `components/purchases/purchases-empty-state.tsx` | `router.push("/catalog")` | `app/(crm)/purchases/page.tsx` (fora do funil) | **Não alterado** — falso positivo já mapeado no brief; confirmado via grep de uso que só é renderizado no CRM |
| — | `components/marketplace/marketplace-header.tsx` | `router.push("/")`, `Link`/`LocaleLink` mistos | `app/[locale]/**` | Já corrigido em rodada anterior — `useRouter`/`Link` já vêm do wrapper para `/`, `/catalog`, `/faq`, `/my-purchases`; `next/link` puro só para `/dashboard`, `/super-admin`, `/sign-in` (fora do segmento). Sem alteração nesta rodada |
| — | `components/marketplace/locale-switcher.tsx` | `router.replace(pathname, { locale })` | `app/[locale]/**` | Já correto (wrapper) — sem alteração |
| — | `app/[locale]/checkout/page.tsx` | `router.push("/catalog")`, `Link href="/cart"` | próprio arquivo | Já usa o wrapper (`import { Link, useRouter } from "@/lib/i18n/navigation"`) — sem alteração |
| — | `components/blog/language-switcher.tsx`, `components/blog/post-card.tsx`, `components/landing/blog-teaser-section.tsx`, `app/[locale]/blog/page.tsx` | `Link` de `next/link` com `href={getPathname({ href, locale })}` | `app/[locale]/blog/**` | **Sem alteração de lógica** — padrão pré-existente correto (a string já vem com o prefixo de locale montado por `getPathname`, então o `Link` puro não perde idioma). Só recebeu comentário de desativação pontual (ver Parte 2) |
| — | `components/marketplace/marketplace-footer.tsx` | `Link` de `next/link` para `/sign-in`, `/terms`, `/privacy` | `app/[locale]/**` | **Sem alteração de lógica** — todos fora do segmento. Comentário de desativação pontual adicionado |
| — | `components/faq/faq-contact-form.tsx` | `Link href="/privacy"` | `app/[locale]/faq/page.tsx` (via `FaqPageContent`) | **Sem alteração de lógica** — fora do segmento. Comentário de desativação pontual adicionado |
| — | `app/[locale]/checkout/success/page.tsx` | `Link href="/dashboard"` (next/link) + `redirect("/sign-in?...")` (next/navigation) | próprio arquivo | **Sem alteração de lógica** — ambos fora do segmento (já corrigidos na rodada 2 para os alvos dentro do segmento). Comentários de desativação pontual adicionados |
| — | `app/[locale]/my-purchases/page.tsx` | `Link href="/dashboard"` + `redirect("/sign-in?...")` | próprio arquivo | **Sem alteração de lógica** — idem acima |

Nenhuma ocorrência de `<a href=...>` bruto nem `window.location` apareceu
nos diretórios do funil. Todas as combinações de import misto (`Link` +
`LocaleLink`, `useRouter` + `usePlainRouter`) foram conferidas caso a caso
confirmando onde cada componente é renderizado antes de decidir.

### Os dois casos mistos mais delicados

`buy-now-button.tsx` e `paypal-buttons.tsx` tinham a *mesma* chamada de
`router.push` saltando entre uma rota dentro do segmento (`/checkout`,
`/checkout/success`, `/checkout/cancel`) e uma rota fora dele (`/sign-in`)
dependendo de uma condição em runtime (sessão expirada / não autenticado).
Trocar só o import do `useRouter` para o wrapper teria corrigido o caminho
feliz mas quebrado o caminho de `/sign-in` (o wrapper adicionaria um
prefixo de idioma a uma rota que não vive sob `app/[locale]/`). A solução
foi manter os dois routers lado a lado:

```ts
import { useRouter as usePlainRouter } from "next/navigation"
import { useRouter } from "@/lib/i18n/navigation"
```

usando `router` (wrapper) para os alvos do funil e `plainRouter` (puro)
para `/sign-in`, com um comentário explicando o motivo em cada import.

## Parte 2 — Trava de ESLint

Adicionei um bloco de `no-restricted-imports` em `eslint.config.mjs`,
escopado via `files` (equivalente a `overrides` no flat config) aos seis
diretórios exclusivos do funil:

```js
files: [
  "app/[[]locale[]]/**/*.{ts,tsx}",
  "components/marketplace/**/*.{ts,tsx}",
  "components/checkout/**/*.{ts,tsx}",
  "components/landing/**/*.{ts,tsx}",
  "components/faq/**/*.{ts,tsx}",
  "components/blog/**/*.{ts,tsx}",
],
```

**Achado técnico durante a implementação:** o glob `app/[locale]/**` não
funciona — o ESLint flat config resolve `files` com `minimatch` (confirmado
lendo `node_modules/@eslint/config-array/package.json`), que trata
`[locale]` como uma classe de caracteres regex, não como o nome literal do
diretório. Testei diretamente com `Minimatch` (script descartável) e
confirmei: `app/\[locale\]/**` (escape de barra invertida) também falha —
o parser do minimatch v3 tropeça no `\]` dentro do glob-star e monta um
regex quebrado. O padrão que funciona (confirmado com `Minimatch.makeRe()`
e depois com `npx eslint` real contra os arquivos) é o truque de classe de
caracteres: `[[]locale[]]`, onde `[[]` casa um `[` literal e `[]]` casa um
`]` literal. Documentei isso com um comentário no `eslint.config.mjs` para
que não seja "corrigido" de volta para `[locale]` no futuro.

A regra restringe:
- `next/link` (import default inteiro) — qualquer import é sinalizado.
- `next/navigation`, mas só os nomes `useRouter` e `redirect` — deixei
  `usePathname`, `useSearchParams` e `notFound` livres, porque não são a
  causa da classe de bug (nenhuma ocorrência real os usava para navegar
  para fora do locale correto) e bloqueá-los geraria ruído sem sinal em
  páginas que só os usam para ler estado da URL ou 404.

Mensagem (em português) explica usar `@/lib/i18n/navigation` e que, para
rotas fora do segmento, o import puro é legítimo e pode ser dispensado
linha a linha com `// eslint-disable-next-line no-restricted-imports` e um
comentário curto.

### Rodando o lint após criar a regra

13 erros novos apareceram, todos em usos **legítimos** (rotas fora do
segmento, ou padrão pré-existente `Link` + `getPathname()`). Resolvi cada
um com desativação pontual na linha do import, nunca no arquivo inteiro:

| Arquivo | Linha | Import restrito | Justificativa no comentário |
|---|---|---|---|
| `app/[locale]/blog/page.tsx` | `Link` de next/link | href sempre montado via `getPathname()` |
| `app/[locale]/checkout/success/page.tsx` | `Link` de next/link | único uso restante é `/dashboard`, fora do segmento |
| `app/[locale]/checkout/success/page.tsx` | `redirect` de next/navigation | único uso restante é `/sign-in`, fora do segmento |
| `app/[locale]/my-purchases/page.tsx` | `redirect` de next/navigation | único uso restante é `/sign-in`, fora do segmento |
| `app/[locale]/my-purchases/page.tsx` | `Link` de next/link | único uso restante é `/dashboard`, fora do segmento |
| `components/blog/language-switcher.tsx` | `Link` de next/link | href sempre montado via `getPathname()` |
| `components/blog/post-card.tsx` | `Link` de next/link | href sempre montado via `getPathname()` |
| `components/landing/blog-teaser-section.tsx` | `Link` de next/link | href sempre montado via `getPathname()` |
| `components/checkout/paypal-buttons.tsx` | `useRouter as usePlainRouter` | usado só para `/sign-in`, fora do segmento |
| `components/faq/faq-contact-form.tsx` | `Link` de next/link | único uso é `/privacy`, fora do segmento |
| `components/marketplace/buy-now-button.tsx` | `useRouter as usePlainRouter` | usado só para `/sign-in`, fora do segmento |
| `components/marketplace/marketplace-footer.tsx` | `Link` de next/link | usos restantes são `/sign-in`, `/terms`, `/privacy`, fora do segmento |
| `components/marketplace/marketplace-header.tsx` | `Link` de next/link | usos restantes são `/dashboard`, `/super-admin`, `/sign-in`, fora do segmento |

Depois dessas 13 desativações pontuais, `npm run lint` volta a mostrar
exatamente os mesmos 11 problemas (6 erros, 5 avisos) que já existiam na
baseline antes de qualquer mudança desta task — confirmado rodando
`git stash` e comparando a saída antes/depois. Nenhum é novo nem
relacionado a este trabalho:

- `components/cookie-consent.tsx` e `components/my-purchases/public-purchase-list.tsx`:
  `@next/next/no-html-link-for-pages` (`<a>` cru em vez de `<Link>`) —
  pré-existente, fora do escopo desta task.
- 4 avisos `@next/next/no-img-element` (`<img>` em vez de `<Image>`) —
  pré-existentes.
- 1 aviso `react-hooks/incompatible-library` em `faq-contact-form.tsx`
  (`react-hook-form`'s `watch()`) — pré-existente.

## Verificação executada

### `npx tsc --noEmit`
Sem saída — 0 erros.

### `npx vitest run`
```
Test Files  16 passed (16)
     Tests  69 passed (69)
```

### `npm run lint`
13 erros novos da regra, todos resolvidos com desativação pontual (ver
tabela acima). Após as resoluções, saída idêntica à baseline (11
problemas pré-existentes, 6 erros + 5 avisos, nenhum novo).

### `npm run build`
Precisei matar os processos `next dev`/`node` que ainda seguravam o
`.prisma\client\query_engine-windows.dll.node` (EPERM no Windows, mesmo
sintoma já registrado na memória do ambiente) antes de rodar o build:
```powershell
Stop-Process -Id <pids do next dev / start-server / postcss> -Force
```
Depois disso:
```
✓ Compiled successfully in 14.7s
Finished TypeScript in 17.5s
✓ Generating static pages using 15 workers (106/106)
```
Todas as rotas do funil (`/[locale]`, `/[locale]/blog`, `/[locale]/cart`,
`/[locale]/catalog`, `/[locale]/checkout`, `/[locale]/checkout/cancel`,
`/[locale]/checkout/success`, `/[locale]/faq`, `/[locale]/list/[slug]`,
`/[locale]/my-purchases`) aparecem no output, sem erros.

### Dev server (porta 3001) — status codes

```
/             -> 200      /crm          -> 307
/faq          -> 200      /checkout     -> 307
/de           -> 200      /my-purchases -> 307
/de/faq       -> 200      /super-admin  -> 307
/catalog      -> 200
/de/catalog   -> 200
/cart         -> 200
/de/cart      -> 200
/blog         -> 200
/de/blog      -> 200
/privacy      -> 200
/terms        -> 200
/sign-in      -> 200
```
Todos batem com o esperado.

**HTML renderizado em `/de/catalog`** (`curl | grep -oE 'href="[^"]*"'`):
rotas do funil (`/de`, `/de/catalog`, `/de/faq`, `/de/my-purchases`,
`/de/list/...`) saem com prefixo `/de/`; `/privacy`, `/terms`, `/sign-in`
saem sem prefixo, como esperado.

## Commit

Um commit cobrindo os 9 arquivos de código corrigidos (5 da lista original
+ os 4 arquivos que só receberam comentário de desativação pontual sem
mudança de lógica, mais os 5 arquivos com desativação pontual que também
não mudaram de lógica) e a regra nova de ESLint.

## Preocupações

1. **Verificação interativa ao vivo não foi possível para os fluxos
   client-side desta rodada** (busca do catálogo, filtros, "comprar
   agora", cancelamento do PayPal). Tentei exercitar via o browser
   embutido (preencher o campo de busca, disparar o evento `input`,
   submeter o formulário via `requestSubmit()` e capturar `history.pushState`
   com um monkey-patch), mas o contexto de execução do navegador embutido
   reiniciava entre chamadas de forma inconsistente (`window.__pushed`
   voltava `undefined` mesmo tendo sido definido na chamada anterior, e uma
   tentativa chegou a retornar "Inspected target navigated or closed").
   Isso é consistente com a limitação já registrada na memória do ambiente
   ("browser embutido não faz swap de Suspense"). A confiança na correção
   vem de três fontes independentes em vez da interação ao vivo: (a) o
   padrão aplicado é idêntico ao já usado e validado em
   `app/[locale]/checkout/page.tsx` (`router.push("/catalog")` via o
   mesmo wrapper, confirmado funcionando na rodada 2); (b) `tsc`, `vitest`
   e `build` passam limpos; (c) os links estáticos renderizados por
   `curl` confirmam que o mesmo locale-switcher/wrapper já produz URLs
   corretas em todas as páginas do funil. Recomendo um teste manual de
   clique (busca, filtro, comprar agora, e principalmente o retorno do
   PayPal em sandbox) em `/de/...` antes do merge final, dada a
   sensibilidade do fluxo de pagamento.
2. **`components/purchases/purchases-empty-state.tsx` não foi tocado**,
   conforme instruído — confirmado via grep que só é usado em
   `app/(crm)/purchases/page.tsx`.
3. Não toquei em `actions/locale.ts` nem `lib/i18n/resolve-locale.ts`,
   conforme instruído.
4. A regra de ESLint não bloqueia `usePathname`/`useSearchParams`/
   `notFound` de `next/navigation` — decisão deliberada para não gerar
   ruído em usos legítimos que não são a causa desta classe de bug (ler
   estado da URL ou disparar 404 não perde locale). Se uma futura
   ocorrência usar `usePathname` do `next/navigation` puro para *montar*
   um `href` de navegação (em vez de só ler), a regra atual não pegaria —
   vale revisar se isso aparecer no futuro.
