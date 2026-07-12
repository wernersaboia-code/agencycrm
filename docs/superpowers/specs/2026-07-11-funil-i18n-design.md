# Localização do funil (PT/DE via cookie) — Design

**Data:** 2026-07-11
**Status:** Aprovado (aguardando revisão da spec)

## Objetivo

Fazer o catálogo, o carrinho, o detalhe da lista e o checkout aparecerem em
alemão para usuários em alemão. Hoje essas telas têm texto hardcoded em
português e ficam sob um layout que fixa `locale="pt"`, então um usuário que
sai de `/de` e clica em "Katalog" vê tudo em PT (incluindo o carrinho).

## Idiomas e escopo

- Idiomas: `pt` (padrão) e `de` — os dois que o site já suporta.
- Telas no escopo: `/catalog`, carrinho global (`cart-drawer`, `cart-badge`,
  `cart-item`, `add-to-cart-button`), `/list/[slug]`, `/checkout`,
  `/checkout/success`, `/checkout/cancel`.
- Fora do escopo: outros idiomas (EN/ES/FR/AR/IT/NL), CRM/super-admin, e
  reestruturar o app para `app/[locale]`.

## Decisão de arquitetura

Resolução de idioma por **cookie** (`NEXT_LOCALE`), padrão do next-intl para
site parcialmente localizado. Sem novas rotas; a URL do funil continua sem
prefixo de idioma (ex.: `/catalog`), e o cookie carrega o idioma.

### Resolução — `i18n/request.ts`

Ordem de precedência:
1. `locale` explícito (quando a chamada passa `getTranslations({ locale })`
   — a home PT e as páginas `/de` continuam funcionando como hoje).
2. Cookie `NEXT_LOCALE`, se for `pt` ou `de`.
3. Padrão `pt`.

Lê o cookie com `cookies()` de `next/headers`. Só aceita valores em
`["pt","de"]` (senão cai no padrão).

### Gravação do cookie

1. **`setLocaleCookie(locale)`** — nova server action (`actions/locale.ts`):
   valida `locale ∈ {pt,de}` e grava o cookie `NEXT_LOCALE` (path `/`,
   `sameSite=lax`, 1 ano, sem `httpOnly` pois o `SyncLocaleCookie` também
   lê/grava no cliente). Chamada pelo `LocaleSwitcher` antes de navegar —
   caminho principal e confiável.
2. **`SyncLocaleCookie({ locale })`** — novo componente client (espelha o
   padrão do `HtmlLang`): num `useEffect`, se o cookie atual difere de
   `locale`, grava `document.cookie = "NEXT_LOCALE=<locale>; path=/;
   max-age=31536000; samesite=lax"`. Renderizado por:
   - `app/de/layout.tsx` com `locale="de"`.
   - a home PT `app/(marketplace)/page.tsx` com `locale="pt"`.
   Mantém o cookie alinhado à landing que o usuário está vendo, então
   `/de` → "Katalog" → `/catalog` já resolve `de`.

**Trade-off aceito:** um usuário com cookie `de` que digita `/` diretamente vê
a home PT (que força `locale="pt"`) com um flash de chrome alemão até o
`SyncLocaleCookie` regravar `pt`; autocorrige na navegação seguinte. Caso raro.

### Layout do marketplace — `app/(marketplace)/layout.tsx`

Passa a ser dinâmico (lê cookie). Em vez de `locale="pt"` fixo:
- `const locale = await getLocale()` (next-intl, resolvido pelo cookie).
- `const messages = await getMessages()` e provê ao `NextIntlClientProvider`
  apenas os namespaces que os componentes client sob o layout usam:
  `nav` e `cart` (o drawer/badge/item são client). Namespaces de páginas
  server (`catalog`, `checkout`) são lidos via `getTranslations` diretamente,
  sem passar pelo provider.
- `<MarketplaceFooter locale={locale} />` recebe o locale resolvido.

O `LocaleSwitcher` já existente ganha as duas entradas (pt/de) chamando
`setLocaleCookie` + `router.refresh()`/navegação para reavaliar o layout.

## Extração de strings

Novos namespaces em `messages/pt.json` e `messages/de.json`:
- `catalog` — títulos, filtros, rótulos, estados vazios da página `/catalog` e
  do detalhe `/list/[slug]`.
- `cart` — drawer, badge, item, botão adicionar (ex.: "itens", "Subtotal",
  "Ver catálogo", "Finalizar compra", "Carrinho vazio").
- `checkout` — `/checkout`, `success`, `cancel` (passos, resumo, botões,
  mensagens de confirmação/cancelamento).

Fiação:
- Server components (`catalog/page.tsx`, `list/[slug]/page.tsx`,
  `checkout/*`): `getTranslations("<ns>")` (locale via cookie).
- Client components (`cart-drawer`, `cart-badge`, `cart-item`,
  `add-to-cart-button`): `useTranslations("cart")` a partir do provider.
- Interpolações (contagens, valores) via ICU do next-intl (ex.:
  `{count, plural, one {# item} other {# itens}}`); moeda continua via
  `formatCurrency`.

## Não-objetivos / notas

- A página de sucesso do checkout já era hardcoded PT — entra aqui.
- Nenhum link de navegação muda (o cookie carrega o idioma).
- `formatCurrency` e formatação de números permanecem como estão.

## Critérios de sucesso

- Em `/de`, clicar em "Katalog" leva a `/catalog` renderizado em alemão,
  incluindo o drawer do carrinho ao abrir.
- Trocar o idioma no seletor reflete no funil inteiro (catálogo → carrinho →
  checkout) sem trocar de URL.
- Um usuário PT continua vendo tudo em português (padrão).
- Build de produção passa; nenhuma regressão nas landings `/` e `/de`.
