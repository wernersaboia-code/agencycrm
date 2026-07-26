# PAY-1 — Stripe como segundo provedor (Implementation Plan)

> Spec: `docs/superpowers/specs/2026-07-23-revisao-super-admin-crm-seguranca-ux-features-design.md` (WS-7, PAY-1).
> Execução direta pelo agente principal (sem subagentes). Progresso em `.superpowers/sdd/progress-pay1.md`.

**Goal:** O comprador escolhe no checkout entre PayPal (fluxo atual, intocado) e Stripe (Checkout hospedado). Fulfillment idêntico e idempotente nos dois caminhos; webhooks dos dois lados com assinatura verificada.

**Decisões tomadas com Werner (2026-07-25):**
1. **Stripe Checkout hospedado** (redirect para página do Stripe) — zero superfície PCI, espelha o fluxo de redirect do PayPal.
2. **Purchase aditivo** — mantém `paypalOrderId`/`paypalPayerId`; acrescenta `provider` + `stripeSessionId` + `stripePaymentIntentId`. Sem backfill.
3. **Confirmação espelha o PayPal** — frontend chama `confirm-session` ao voltar do Stripe (efetiva na hora, idempotente); webhook `checkout.session.completed` reconcilia se o navegador fechar.

**Fora de escopo:** refund (depende de SA-F4, que ainda não existe nem para PayPal); Pix/boleto (Pix é invite-only na conta BR; Checkout habilita cartão por padrão); `stripeCustomerId` do Workspace (billing futuro, não marketplace).

## Global Constraints

- **Migração Prisma sem shadow DB:** `migrate diff` → limpar SQL → `db execute` → `migrate resolve --applied`. Conferir o SQL antes de aplicar (drift pré-existente pode não existir mais, mas a checagem é obrigatória). **Aplicação no banco real só com confirmação do Werner.**
- **Node fora do PATH:** `export PATH="/c/Program Files/nodejs:$PATH"` em cada shell (PowerShell: `$env:PATH = "C:\Program Files\nodejs;$env:PATH"`).
- **Dinheiro em centavos na fronteira Stripe:** conversão `unit_amount = Math.round(preço * 100)` e leitura `amount_total / 100` com 2 casas — funções puras testadas. Nunca ponto flutuante solto na comparação (reusa `amountMatches` do fulfillment).
- **Assinatura de webhook fail-closed:** sem `STRIPE_WEBHOOK_SECRET` ou assinatura inválida → 401, evento rejeitado.
- **Compra falha nunca é marcada depois de paga:** espelha a regra do PayPal — `failed` só a partir de `pending`, e nunca após captura confirmada.
- **Idioma/estilo:** comentários e UI em português, símbolos em inglês, 4 espaços, sem ponto e vírgula.
- **Moeda:** listas têm `currency` própria (EUR hoje). Stripe aceita EUR normalmente em test mode; a restrição de liquidação BRL da conta BR afeta payout, não a cobrança. Mixed currency no carrinho já é rejeitado pelo fluxo atual e se mantém.

## Estrutura de arquivos

**Criar:**
- `prisma/migrations/20260725120000_add_stripe_provider_to_purchase/migration.sql`
- `lib/stripe.ts` — client lazy + conversões puras de valor (`toStripeAmount`, `fromStripeAmount`) + `isStripeConfigured`
- `lib/stripe.test.ts`
- `app/api/checkout/stripe/create-session/route.ts`
- `app/api/checkout/stripe/confirm-session/route.ts`
- `app/api/checkout/stripe/webhook/route.ts`
- `components/checkout/stripe-checkout-button.tsx`
- `app/[locale]/checkout/stripe-return/page.tsx`
- `.superpowers/sdd/progress-pay1.md`

**Modificar:**
- `prisma/schema.prisma` — enum `PaymentProvider`, campos no `Purchase`
- `lib/checkout/fulfillment.ts` — `fulfillPurchase(db, params)` genérico; `fulfillPurchaseByOrderId` vira wrapper PayPal
- `lib/checkout/fulfillment.test.ts` — testes dos dois provedores
- `lib/server-env.ts` — `getStripeServerConfig()`
- `lib/env.ts` — `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + getter opcional
- `app/[locale]/checkout/page.tsx` — renderiza o botão Stripe abaixo do PayPal
- `messages/*.json` (7 locales) — chaves `checkout.payWithCard`, `checkout.stripeConfirming`, `checkout.stripeConfirmFailed`
- `.env.example` — seção Stripe
- `package.json` — dependência `stripe`

---

## Task 1: Migração — provider + campos Stripe no Purchase

**Files:** `prisma/schema.prisma`, nova migração.

```prisma
enum PaymentProvider {
  paypal
  stripe
}

model Purchase {
  // ...
  provider              PaymentProvider @default(paypal)
  paypalOrderId         String?         @unique
  paypalPayerId         String?
  stripeSessionId       String?         @unique
  stripePaymentIntentId String?
  // ...
}
```

Passos: editar schema → `migrate diff` → limpar SQL (só o `CREATE TYPE "PaymentProvider"`, o `ALTER TABLE "purchases"` com 3 colunas e o `CREATE UNIQUE INDEX ... stripeSessionId`) → **pedir confirmação do Werner** → `db execute` + `migrate resolve` + `generate`.

Esperado no SQL final (referência):

```sql
CREATE TYPE "PaymentProvider" AS ENUM ('paypal', 'stripe');
ALTER TABLE "purchases" ADD COLUMN "provider" "PaymentProvider" NOT NULL DEFAULT 'paypal',
ADD COLUMN "stripePaymentIntentId" TEXT,
ADD COLUMN "stripeSessionId" TEXT;
CREATE UNIQUE INDEX "purchases_stripeSessionId_key" ON "purchases"("stripeSessionId");
```

## Task 2: Generalizar o fulfillment (2 provedores) + testes

**Files:** `lib/checkout/fulfillment.ts`, `lib/checkout/fulfillment.test.ts`

- Nova função genérica (padrão dos helpers cold-mail: `db` injetado, testável):

```ts
export async function fulfillPurchase(
    db: PrismaClient,
    params: {
        provider: "paypal" | "stripe"
        providerOrderId: string        // paypalOrderId ou stripeSessionId
        capturedAmount: CapturedAmount | null
        payer?: PayerInfo              // payerId só existe no PayPal
        providerPaymentId?: string | null // paymentIntentId (Stripe)
    }
): Promise<FulfillOutcome>
```

- Lookup por provider (`findUnique` em `paypalOrderId` ou `stripeSessionId`); updateMany escreve `paypalPayerId` (paypal) ou `stripePaymentIntentId` (stripe) conforme o provider; resto do fluxo (amount check, transição condicional, e-mail) intacto.
- `fulfillPurchaseByOrderId(params)` vira wrapper de uma linha chamando `fulfillPurchase(prisma, { provider: "paypal", ... })` — os dois callers atuais (capture-order, webhook PayPal) não mudam.
- Testes novos (mock de `db` no padrão de `campaigns.service.test.ts`, com `vi.mock` de `@/lib/auth/magic-link` e `@/lib/email/purchase`):
  1. paypal faz lookup por `paypalOrderId` (assert no formato do `where`)
  2. stripe faz lookup por `stripeSessionId`
  3. stripe efetiva gravando `stripePaymentIntentId` e NUNCA `paypalPayerId`
  4. compra já paga → `already_fulfilled` (sem reenviar e-mail)
  5. valor divergente → `amount_mismatch` e não marca paga

## Task 3: `lib/stripe.ts` + env

**Files:** `lib/stripe.ts`, `lib/stripe.test.ts`, `lib/server-env.ts`, `lib/env.ts`, `.env.example`, `package.json` (+`stripe`)

```ts
// lib/stripe.ts
export function isStripeConfigured(): boolean
export function getStripe(): Stripe                       // instancia por chamada (padrão paypalOrders)
export function toStripeAmount(value: number): number     // Math.round(v * 100)
export function fromStripeAmount(cents: number): string   // (c / 100).toFixed(2)
```

- `server-env.ts`: `getStripeServerConfig()` → `{ secretKey: getRequiredServerEnv("STRIPE_SECRET_KEY"), webhookSecret: getRequiredServerEnv("STRIPE_WEBHOOK_SECRET") }`. Webhook usa getter próprio para mensagem clara.
- `env.ts`: adiciona `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ao `publicEnv` + `getOptionalPublicStripePublishableKey()` (presença da pk é o sinal público de "Stripe habilitado" para a UI, espelhando o PayPal).
- `.env.example`: seção STRIPE com `STRIPE_SECRET_KEY="sk_test_..."`, `STRIPE_WEBHOOK_SECRET="whsec_..."`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."` (comentário: secret do webhook vem de `stripe listen` no dev ou do Dashboard em produção).
- Testes das conversões (incl. `fromStripeAmount` devolver "10.00" para 1000 — formato exato que `amountMatches` exige).

## Task 4: Rota `POST /api/checkout/stripe/create-session`

Espelha `create-order` (mesma auth, rate limit `checkout:create`, backstop de pendentes, mesmo zod, mesma validação de listas/moeda única, mesmo cálculo de total). Diferenças:

1. `isStripeConfigured()` falso → 503 `{ error: "Stripe not configured" }` (UI esconde o botão; isto é backstop).
2. `stripe.checkout.sessions.create({ mode: "payment", line_items (price_data com unit_amount em centavos, currency minúscula), customer_email: user.email, success_url: appUrl + "/checkout/stripe-return?session_id={CHECKOUT_SESSION_ID}", cancel_url: appUrl + "/checkout/cancel" })`.
3. `prisma.purchase.create` com `provider: "stripe"`, `stripeSessionId: session.id`, status `pending` (mesmos itens/valores do PayPal).
4. Resposta `{ url: session.url, purchaseId }`; `session.url` nulo → 500.

## Task 5: Rota `POST /api/checkout/stripe/confirm-session`

Espelha `capture-order`: auth, rate limit `checkout:confirm`, zod `{ sessionId }`, ownership check `findFirst({ stripeSessionId, userId, status: "pending" })` → 404.

1. `stripe.checkout.sessions.retrieve(sessionId)`
2. `session.payment_status !== "paid"` → 400 "Payment not completed" (não marca failed; webhook/sessão expirada resolvem)
3. `capturedAmount` = `{ value: fromStripeAmount(session.amount_total), currency: session.currency.toUpperCase() }` (null-safe)
4. `fulfillPurchase(prisma, { provider: "stripe", providerOrderId: sessionId, capturedAmount, payer: { email, name } de customer_details, providerPaymentId: session.payment_intent })`
5. Mesmo switch de outcome do PayPal (`fulfilled` → `{ success, purchaseId, accessUrl }`, etc.)

## Task 6: Rota `POST /api/checkout/stripe/webhook`

- `await request.text()` (corpo cru é obrigatório para a assinatura) + header `stripe-signature`.
- Sem `STRIPE_WEBHOOK_SECRET` → warn + 401 (fail-closed, espelhando PayPal sem `PAYPAL_WEBHOOK_ID`).
- `getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)`; erro → 401.
- `checkout.session.completed`: só efetiva se `payment_status === "paid"` (métodos assíncronos ficam para eventos futuros); chama `fulfillPurchase` como na Task 5; log do outcome.
- `checkout.session.expired`: `updateMany({ stripeSessionId, status: "pending" } → failed)` — mesma regra do DENIED do PayPal: só falha pendente, nunca uma paga.
- Erro de processamento → 500 (Stripe reentrega); demais eventos → 200 ignorado. `export const dynamic = "force-dynamic"`.

## Task 7: UI — escolha do método

**`components/checkout/stripe-checkout-button.tsx`** (client):
- Retorna `null` se `getOptionalPublicStripePublishableKey()` vazio (Stripe desaparece da tela em vez de exibir erro — PayPal continua funcionando).
- Botão outline full-width (ícone `CreditCard`, label `t("payWithCard")`), loading interno, clique → `POST create-session` → `window.location.href = url`.
- 401/403 → toast `sessionExpiredPay` + redirect `/sign-in?redirect=/checkout&lang=` (mesmo fluxo do botão PayPal); demais erros → toast `createFailed`.

**`app/[locale]/checkout/page.tsx`:** `<StripeCheckoutButton items={paypalItems} />` abaixo de `<PayPalButtonsWrapper />`, com `mt-3`.

**`app/[locale]/checkout/stripe-return/page.tsx`** (client, `useSearchParams` dentro de `<Suspense>`):
- Lê `session_id`, chama `confirm-session` uma vez (ref contra double-run do StrictMode — idempotente no servidor de qualquer forma).
- Sucesso → `clearCart()` + `router.push(/checkout/success?purchaseId=...)` + toast `paymentConfirmed`.
- 401 → sign-in redirect (espelha capture flow); demais falhas → estado de erro com `stripeConfirmFailed` + link para `/my-purchases` (o webhook reconcilia).

**i18n (7 locales):** `payWithCard`, `stripeConfirming`, `stripeConfirmFailed` em pt/en/de/es/fr/it/nl.

## Task 8: Verificação final

- `npx tsc --noEmit` limpo; `npm test` verde (baseline 342 + novos).
- `next build` passa (rota de webhook com `force-dynamic`).
- Checklist de aceite da spec: compra por Stripe **ou** PayPal; fulfillment idêntico; webhooks verificados; testes cobrindo os dois provedores. Refund fica registrado como dependente de SA-F4.
- Teste manual guiado para Werner (com `stripe listen --forward-to` no dev): cartão `4242 4242 4242 4242`, compra de ponta a ponta.

## Riscos

- **Sessão criada e purchase.create falha:** impossível de pagar — o redirect só acontece depois da resposta 200 com a compra gravada (mesma ordenação do PayPal).
- **`session_id` na URL de retorno:** o confirm-session valida ownership (`userId` + `pending`) antes de efetivar; um id alheio devolve 404.
- **Double-run do React StrictMode na stripe-return:** confirm-session é idempotente (transição condicional no fulfillment); ref no client evita chamada dupla visível.
- **Comprador fecha a aba no Stripe:** sessão expira → webhook `checkout.session.expired` marca `failed`; se pagou e fechou, `checkout.session.completed` efetiva e o e-mail de confirmação chega.
