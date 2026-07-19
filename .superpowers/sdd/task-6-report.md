# Task 6 — Relatório: correção do achado Critical (links do funil em `app/[locale]/` perdiam o idioma)

## Contexto

Uma correção anterior (commit `52320b0`, "refactor(i18n): troca de idioma por
segmento e links cientes de locale") já tinha trocado os `Link`/`useRouter`
de `next/link`/`next/navigation` pelo wrapper de `lib/i18n/navigation.ts` nos
componentes de `components/`, mas não tinha visitado as páginas do funil em
`app/[locale]/`. Um usuário em `/de/...` clicando em "voltar ao catálogo" a
partir do carrinho, checkout, detalhe de lista ou minhas compras caía de
volta no português (o `Link` fixo de `next/link` não carrega prefixo de
idioma). A paginação do catálogo tinha o mesmo problema.

## Arquivos corrigidos

1. **`app/[locale]/cart/page.tsx`** — todos os `Link` (`/catalog` x2,
   `/list/${item.slug}`, `/checkout`) apontam para rotas dentro do segmento.
   Import trocado de `next/link` para `{ Link } from "@/lib/i18n/navigation"`
   (import único, sem alias — nenhuma rota fora do segmento neste arquivo).

2. **`app/[locale]/list/[slug]/page.tsx`** — único `Link href="/catalog"`
   (botão voltar). Mesmo tratamento: import único do wrapper.

3. **`app/[locale]/checkout/page.tsx`** — `Link href="/cart"` e
   `router.push("/catalog")`. Trocado `Link` e `useRouter` de
   `next/link`/`next/navigation` para o wrapper (`import { Link, useRouter }
   from "@/lib/i18n/navigation"`).

4. **`app/[locale]/checkout/cancel/page.tsx`** — três `Link`
   (`/checkout`, `/cart`, `/catalog`), todos dentro do segmento. Import
   único do wrapper.

5. **`app/[locale]/checkout/success/page.tsx`** — misto: `Link
   href="/my-purchases"` e `Link href="/catalog"` (dentro do segmento) vs.
   `Link href="/dashboard"` (fora do segmento, mantido com `next/link`).
   Import com alias, seguindo o padrão de
   `components/marketplace/marketplace-header.tsx`:
   ```ts
   import Link from "next/link"
   import { Link as LocaleLink, getPathname } from "@/lib/i18n/navigation"
   ```
   **Achado adicional (fora da lista original, encontrado na varredura):**
   este arquivo também tinha dois `redirect("/catalog")` (de
   `next/navigation`) — mesmo bug, em forma de redirect de servidor em vez
   de `Link`. Corrigido com `redirect(getPathname({ href: "/catalog",
   locale }))`, mantendo o `redirect` nativo de `next/navigation` para o
   alvo `/sign-in` (fora do segmento) intocado. `locale` obtido via
   `getLocale()` de `next-intl/server`.

   Optei por **não** usar o `redirect` do próprio wrapper de navegação
   (`createNavigation`) para o alvo `/catalog`: seu tipo declarado
   (`(args: {href, locale}) => never`) some do fluxo de inferência do
   TypeScript quando resolvido pelos tipos `.d.ts` de cliente (`tsc` não
   aplica a condição de export `"react-server"` do `next-intl` sem
   `customConditions`), e isso quebrava o estreitamento de nulidade de
   `purchase` nas linhas seguintes (`TS18047`). Usar `getPathname()` (função
   pura, sem esse problema de tipo) só para montar a string, e passar essa
   string para o `redirect` nativo, preserva tanto o comportamento correto
   quanto o estreitamento de tipo.

6. **`app/[locale]/my-purchases/page.tsx`** — dois `Link href="/catalog"`
   (dentro do segmento) e um `Link href="/dashboard"` (fora do segmento).
   Mesmo padrão de alias:
   ```ts
   import Link from "next/link"
   import { Link as LocaleLink } from "@/lib/i18n/navigation"
   ```

7. **`app/[locale]/catalog/page.tsx`** — `buildPageHref` e `PageLink`
   montavam `/catalog?...` fixo e renderizavam com `next/link`. A string
   retornada por `buildPageHref` continua relativa (`/catalog?...`); a
   correção foi trocar apenas o import do `Link` para o wrapper
   (`import { Link } from "@/lib/i18n/navigation"`), que adiciona o prefixo
   de idioma automaticamente a partir do locale de requisição atual —
   mesmo padrão já usado em `components/marketplace/marketplace-header.tsx`.

## Correção adicional (Minor) — destaque do idioma ativo

`components/marketplace/locale-switcher.tsx` recebeu de volta o
`font-semibold` condicional no item do dropdown que corresponde ao locale
atual:

```tsx
<DropdownMenuItem
    key={l}
    onClick={() => switchTo(l)}
    className={l === locale ? "font-semibold" : undefined}
>
```

## Varredura própria (`grep -rn 'from "next/link"\|from "next/navigation"' app/[locale]/`)

Saída após todas as correções, com a classificação de cada ocorrência:

| Arquivo | Import | Uso | Classificação |
|---|---|---|---|
| `layout.tsx` | `next/navigation` (`notFound`) | guarda de locale inválido | Não é link/redirect de navegação — correto como está |
| `my-purchases/page.tsx` | `next/navigation` (`redirect`) | `redirect("/sign-in?redirect=/my-purchases")` | `/sign-in` fica **fora** do segmento — correto como está |
| `my-purchases/page.tsx` | `next/link` (`Link`) | `<Link href="/dashboard">` (único uso restante) | `/dashboard` fica **fora** do segmento — correto como está |
| `list/[slug]/page.tsx` | `next/navigation` (`notFound`) | lista inexistente | Não é navegação — correto |
| `blog/page.tsx` | `next/navigation` (`notFound`) | locale de blog inválido | Não é navegação — correto |
| `blog/page.tsx` | `next/link` (`Link`) | `href={getPathname({ href: "/blog", locale })}` | Já monta o prefixo manualmente via `getPathname` (mesmo wrapper) antes de passar para `next/link` — padrão correto, pré-existente, não mexi |
| `blog/[slug]/page.tsx` | `next/navigation` (`notFound`) | post/locale inválido | Não é navegação — correto |
| `checkout/success/page.tsx` | `next/link` (`Link`) | `<Link href="/dashboard">` (único uso restante) | `/dashboard` fica **fora** do segmento — correto como está |
| `checkout/success/page.tsx` | `next/navigation` (`redirect`) | `redirect(`/sign-in?redirect=...`)` (único uso restante) | `/sign-in` fica **fora** do segmento — correto como está |

Nenhuma ocorrência restante estava classificada errado; todas as que
apontavam para rotas dentro do segmento (`/catalog`, `/cart`, `/checkout`,
`/list/...`, `/my-purchases`) já foram trocadas para o wrapper nas edições
acima.

## Verificação executada

### `npx tsc --noEmit`
Sem output — 0 erros. (A correção do `redirect`/`getPathname` em
`checkout/success/page.tsx` foi necessária justamente para isto passar —
ver nota no item 5.)

### `npx vitest run`
```
Test Files  16 passed (16)
     Tests  69 passed (69)
```

### `npm run build`
```
✓ Compiled successfully in 14.8s
✓ Finished TypeScript in 18.0s
✓ Generating static pages using 15 workers (106/106)
```
Todas as rotas do funil (`/[locale]/cart`, `/[locale]/catalog`,
`/[locale]/checkout`, `/[locale]/checkout/cancel`,
`/[locale]/checkout/success`, `/[locale]/list/[slug]`,
`/[locale]/my-purchases`) aparecem no output, sem erros.

### Dev server (porta 3001) — checagem via `curl`

**Links renderizados, `/de/cart`** (`curl | grep -oE 'href="/(de/)?[a-z/-]+"'`):
```
href="/de"
href="/de/catalog"
href="/de/faq"
href="/de/my-purchases"
href="/privacy"
href="/sign-in"
href="/terms"
```
Todas as rotas do funil (`catalog`, `my-purchases`) saem com `/de/`;
`/privacy`, `/sign-in`, `/terms` (fora do segmento) saem sem prefixo,
como esperado.

**Links renderizados, `/de/catalog`** (mesmo grep, padrão ampliado para
incluir query string e `/list/...`):
```
href="/de"                              href="/de/list/burger-king"
href="/de/catalog"                      href="/de/list/distribuidores-de-alimentos"
href="/de/faq"                          href="/de/list/exportadores-de-vinho"
href="/de/my-purchases"                 href="/de/list/horeca-alemanha"
href="/privacy" / "/sign-in" / "/terms" href="/de/list/importadores-de-alimentos"
                                         href="/de/list/importadores-de-organicos"
```
Não havia mais de uma página de resultados no catálogo de dev (poucas
listas cadastradas), então a paginação (`PageLink`) não apareceu no HTML
renderizado — mas o código-fonte confirma que `buildPageHref` retorna
`/catalog?...` relativo e o `Link` agora vem do wrapper, que adiciona o
prefixo do locale corrente da mesma forma que os demais links acima
(mesmo padrão, mesma função). Recomendo re-testar visualmente a paginação
assim que o catálogo de dev tiver >1 página.

**`/de/my-purchases` e `/de/checkout/cancel` — limitação de verificação:**
ambas as rotas exigem sessão autenticada (`proxy.ts`, comentário original:
"/checkout e /my-purchases exigem sessão"), então `curl` anônimo recebeu
`307` para `/sign-in?redirect=%2Fde%2Fmy-purchases` e
`/sign-in?redirect=%2Fde%2Fcheckout%2Fcancel` respectivamente — o próprio
alvo do redirect já confirma que o middleware preserva o prefixo `/de`
corretamente. Não consegui autenticar uma sessão via `curl` para inspecionar
os `href` renderizados dentro dessas páginas; a correção nelas foi validada
por `tsc`, `build` e leitura de código (mesmo padrão de import usado nas
páginas que pude verificar ao vivo). Recomendo um teste manual autenticado
antes do merge final.

**Status codes finais:**
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

## Commit

Único commit desta task, cobrindo os 7 arquivos de página + o
locale-switcher (Minor):
`app/[locale]/{cart,catalog,checkout,checkout/cancel,checkout/success,
list/[slug],my-purchases}/page.tsx` e
`components/marketplace/locale-switcher.tsx`.

## Preocupações

1. **Paginação do catálogo não foi exercitada ao vivo** — o banco de dev
   não tinha listas suficientes para gerar uma segunda página. A correção
   (troca de import do `Link`) segue exatamente o mesmo padrão validado nos
   outros links desta mesma página (`/de/list/...`), então a confiança é
   alta, mas recomendo confirmação visual quando houver dados suficientes.
2. **`/de/my-purchases` e `/de/checkout/cancel` não puderam ser
   inspecionadas autenticadas** (ver seção de verificação acima) — a
   correção nelas usa o mesmo padrão de import comprovado nas páginas
   públicas, mas não houve confirmação via clique/HTML real por falta de
   uma sessão de teste.
3. Não toquei em `actions/locale.ts` nem `lib/i18n/resolve-locale.ts`,
   conforme instruído.
