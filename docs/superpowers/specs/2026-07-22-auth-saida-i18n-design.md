# Saída e i18n das telas de autenticação — Design

**Data:** 2026-07-22
**Status:** Aprovado (seguindo direto para o plano, a pedido)

## Objetivo

Duas melhorias nas telas de autenticação (`/sign-in`, `/sign-up`), hoje sem
header e inteiramente em português hardcoded:

1. **Saída da tela.** Como o `AuthLayout` não tem header (decisão de manter o ar
   formal), não há como voltar ao site senão pelo botão do navegador. Adicionar
   um **logo de marca centralizado e clicável** que leva à home — âncora de
   marca, não um header.
2. **i18n da auth.** O site é de alcance internacional, mas o sign-in/sign-up só
   existem em pt. Levar essas telas aos **7 idiomas publicados**
   (`pt de en es fr it nl`), preservando o layout formal.

Fora de escopo, decidido no brainstorming: Analytics/Speed Insights (ver abaixo,
já pronto), tradução de `/terms` e `/privacy` (outra faixa), e moeda por
localização (esbarra no tema de pagamento, pausado).

## Descoberta: Analytics e Speed Insights já estão prontos

Levantado durante o brainstorming e registrado aqui para não reabrir: o
`@vercel/analytics` e o `@vercel/speed-insights` **já estão** no
`package.json` (deps `^2.0.1` e `^2.0.0`), instalados em `node_modules`, e
renderizados em [`app/layout.tsx`](../../../app/layout.tsx) (`<Analytics />` e
`<SpeedInsights />` no fim do `<body>`), com o commit já em produção. Nada a
implementar no código — resta apenas, se ainda não estiver, **ativar os dois
produtos no painel da Vercel** (toggle da dashboard, do lado do usuário).

## A restrição que define a arquitetura

O locale, hoje, **vem exclusivamente do segmento de rota `[locale]`** — o
[`i18n/request.ts`](../../../i18n/request.ts) diz textualmente "não mais de
cookie", e o [`LocaleSwitcher`](../../../components/marketplace/locale-switcher.tsx)
só troca o **prefixo da URL**, sem guardar estado. As telas de auth vivem
**fora** de `[locale]` (em `app/(auth)/`), por decisão deliberada — há vários
`eslint-disable no-restricted-imports` documentando que `/sign-in` fica fora do
segmento, e o callback do Supabase aponta para `/sign-in`. Portanto:

- `getLocale()` na auth sempre devolve o padrão (pt) — não há de onde tirar o
  idioma escolhido no site.
- **Layouts no App Router não recebem `searchParams`** — só páginas. Logo, o
  idioma não pode ser resolvido no `AuthLayout`.

### Abordagem escolhida: B — auth fora de `[locale]`, idioma via `?lang`

Descartada a alternativa A (mover a auth para dentro de `[locale]`): colidiria
com o layout de `[locale]`, que injeta o header do marketplace em tudo sob ele
— reintroduzindo justamente o header que decidimos não ter — e tocaria ~15
referências mais os callbacks do Supabase.

Na abordagem B, o idioma é resolvido **na página** (que recebe `searchParams`),
não no layout.

## Arquitetura

### Estrutura de arquivos

- **`app/(auth)/layout.tsx`** — inalterado: continua o container que centraliza
  vertical/horizontalmente. Não contém lógica de locale nem o logo (não pode ler
  `?lang`).
- **`app/(auth)/sign-in/page.tsx`** e **`app/(auth)/sign-up/page.tsx`** —
  passam a ser **server components**. Cada um:
  1. Lê `searchParams` (Promise, Next 16) e extrai `lang`.
  2. Resolve o locale de mensagens com `resolveMessagesLocale(lang)` (reusa a
     lógica de `PUBLISHED_LOCALES`; `lang` ausente/desconhecido → pt).
  3. Importa apenas `messages/<messagesLocale>.json` (não carrega os 7).
  4. Renderiza `<AuthShell locale messages>` com o formulário dentro.
- **`components/auth/auth-shell.tsx`** (novo) — recebe `locale` + `messages` +
  `children`. Abre o `NextIntlClientProvider locale={locale} messages={messages}`
  e, dentro dele, renderiza: o **logo centralizado** e o **seletor de idioma**,
  seguidos de `children`. Manter o provider no topo garante que logo, seletor e
  formulário compartilhem o mesmo contexto de tradução.
- **`components/auth/auth-brand.tsx`** (novo, ou dentro do AuthShell) — o logo:
  `<Link href="/">` do `next/link` comum (com `localePrefix: "as-needed"`, `/`
  é a home pt), `Image src="/logo-icon.png"` (32×32) + texto "Easy Prospect",
  centralizado, `aria-label` traduzido (chave `auth.backToHome`), transição de
  hover discreta. Reusa o padrão visual de
  [`marketplace-header.tsx`](../../../components/marketplace/marketplace-header.tsx).
- **`components/auth/auth-locale-switcher.tsx`** (novo) — client. Estilo Globe2
  igual ao do site, mas em vez de trocar prefixo de URL, atualiza `?lang`
  preservando os demais params (`redirect`, `from`). Lista `PUBLISHED_LOCALES`.
- **`components/auth/sign-in-form.tsx`** e
  **`components/auth/sign-up-form.tsx`** (novos, client) — recebem o corpo
  client atual de `SignInForm`/sign-up (hooks `useState`/`useSearchParams`/
  `useRouter`/`useEffect`, `<Suspense>`, lógica de login intacta), trocando os
  textos hardcoded por `useTranslations("auth")`.

### Fluxo do `?lang`

- **Pontos de entrada que já conhecem o locale** anexam `&lang=<locale>` ao ir
  para `/sign-in`:
  - [`marketplace-header.tsx`](../../../components/marketplace/marketplace-header.tsx) (botão de login)
  - [`marketplace-footer.tsx`](../../../components/marketplace/marketplace-footer.tsx) (link de login)
  - [`buy-now-button.tsx`](../../../components/marketplace/buy-now-button.tsx)
  - [`paypal-buttons.tsx`](../../../components/checkout/paypal-buttons.tsx) (2 pushes)
  - [`checkout/success/page.tsx`](../../../app/[locale]/checkout/success/page.tsx)
  - [`my-purchases/page.tsx`](../../../app/[locale]/my-purchases/page.tsx)
- **Visita direta, callback do Supabase (`/sign-in?erro=…`) e redirects do CRM
  interno** não passam `lang` → caem no **pt**. O seletor na tela permite trocar
  (atualiza `?lang` sem perder `redirect`/`from`). O CRM é interno e serve em pt
  normalmente — seus redirects não recebem `lang` de propósito.

### Extração de strings

Novo namespace **`auth`** nos 7 arquivos `messages/*.json`
(`pt de en es fr it nl`). Cobre:

- **Sign-in:** título/subtítulo da escolha de acesso, cartões (Minhas compras,
  Área Administrativa, CRM — o CRM é invisível na lista mas ainda é destino via
  `?redirect=/dashboard`, então suas strings entram), `CardDescription`, labels
  e placeholders (Email, Senha), `buttonLabel` por área, "Não tem uma conta? /
  Criar conta", mensagens do `?erro=` (`link_expirado`, `link_invalido`,
  `link_incompleto`), toasts de sucesso/erro.
- **Sign-up:** variantes marketplace vs CRM (título, subtítulo, botão), labels e
  placeholders (Nome, Email, Senha), "Próximos passos", "Benefícios", toasts.
- **Compartilhado:** `auth.backToHome` (aria-label do logo), aria-label do
  seletor de idioma.

Tradução dos 7 idiomas feita na implementação, mesmo tom das mensagens de
funil já existentes.

## Componentes e responsabilidades

| Unidade | O que faz | Depende de |
|---|---|---|
| `sign-in/page.tsx`, `sign-up/page.tsx` | Resolve locale de `searchParams.lang`, carrega messages, monta o shell | `resolveMessagesLocale`, `messages/*` |
| `AuthShell` | Provê contexto i18n + moldura (logo, seletor) | `NextIntlClientProvider` |
| `AuthBrand` | Logo clicável → home | `next/link`, `next/image` |
| `AuthLocaleSwitcher` | Troca `?lang` preservando params | `useRouter`/`useSearchParams` |
| `SignInForm`, `SignUpForm` | Fluxo de login/cadastro, textos via i18n | `useTranslations("auth")`, Supabase |

## Verificação

- **Unitário existente:** `resolveMessagesLocale` já tem cobertura para o
  fallback (locale não publicado → pt); reaproveitada para a resolução de
  `?lang`.
- **Funcional/visual (preview):**
  - `/sign-in?lang=de` renderiza em alemão; visita direta a `/sign-in` cai em pt.
  - O seletor troca o idioma preservando `?redirect`/`?from`.
  - O logo leva à home (`/`).
  - `/sign-up` idem, em ao menos 2 idiomas.
  - Um ponto de entrada real (botão de login no header, num locale ≠ pt) chega
    à auth já no idioma certo.

## Fora de escopo (explícito)

- Analytics/Speed Insights — já pronto no código.
- Mover a auth para dentro de `[locale]` (abordagem A).
- Tradução de `/terms` e `/privacy` — faixa própria.
- Moeda por localização — depende do tema de pagamento, pausado.
- i18n do CRM interno — permanece em pt.
