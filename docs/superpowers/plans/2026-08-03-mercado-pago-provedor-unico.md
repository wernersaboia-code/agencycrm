# Mercado Pago como Provedor Único — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o Mercado Pago o único provedor de pagamento ativo do marketplace, cobrando sempre em BRL, com Pix, cartão de crédito, cartão de débito, saldo Mercado Pago e PayPal-dentro-do-MP.

**Architecture:** Espelha o caminho que o Stripe já ocupa — cliente fino, rota de criação, rota de confirmação e webhook — com uma inversão estrutural: o webhook do Mercado Pago só entrega o ID do pagamento, então a chave de correlação é o **nosso** `purchase.id`, enviado como `external_reference`, e a `Purchase` é criada **antes** da preferência. Stripe e PayPal saem da tela do checkout mas permanecem no código.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Prisma 6 + PostgreSQL (Supabase), zod 4, vitest 4, next-intl 4.

**Spec:** `docs/superpowers/specs/2026-08-03-mercado-pago-provedor-unico-design.md`

## Global Constraints

- **Moeda de cobrança: sempre `BRL`.** Nenhuma rota do Mercado Pago aceita outra moeda, em nenhuma circunstância.
- **Preço nunca vem do cliente.** Sai sempre de `resolveListPrices` no servidor, como já ocorre em PayPal e Stripe.
- **Nenhum teste toca o banco.** O padrão do projeto é função pura ou `db` injetado por parâmetro com mock (`lib/checkout/fulfillment.test.ts`). Scripts de integridade que precisam do banco ficam em `prisma/*.ts`, fora do vitest.
- **Migrations Prisma rodam sem shadow database** neste projeto.
- **Comentários e mensagens de commit em português**, seguindo o estilo dos arquivos existentes: o comentário explica *por que*, não *o que*.
- **Indentação: 4 espaços.** Sem ponto e vírgula no fim das linhas (padrão do repositório).
- **Nunca marcar como `failed` uma compra que já esteja `paid`.**
- **Toda verificação de assinatura de webhook é fail-closed:** sem secret ou com assinatura inválida, responde 401 sem processar.
- Base da API: `https://api.mercadopago.com`.
- Textos de UI existem em 7 idiomas: `messages/{pt,en,de,fr,es,it,nl}.json`. Chave nova entra nos 7.
- Rodar testes com `npm test`. Rodar lint com `npm run lint`.

---

### Task 1: Cliente do Mercado Pago

Módulo puro e testável: configuração, conversão de valor e verificação de assinatura. Sem dependência nova — `fetch` nativo e `node:crypto`.

**Files:**
- Create: `lib/mercadopago.ts`
- Create: `lib/mercadopago.test.ts`
- Modify: `lib/server-env.ts` (acrescentar getters ao final)
- Modify: `lib/env.ts:6` e `lib/env.ts:57` (acrescentar a chave pública)

**Interfaces:**
- Consumes: nada (primeira task).
- Produces:
  - `isMercadoPagoConfigured(): boolean`
  - `toMercadoPagoAmount(value: number): number`
  - `fromMercadoPagoAmount(amount: number): string`
  - `verifyMercadoPagoSignature(params: { signatureHeader: string | null; requestId: string | null; dataId: string; secret: string }): boolean`
  - `createPreference(input: CreatePreferenceInput): Promise<{ id: string; initPoint: string }>`
  - `getPayment(paymentId: string): Promise<MercadoPagoPayment>`
  - `type CreatePreferenceInput = { items: Array<{ id: string; title: string; quantity: number; unitPrice: number }>; payerEmail: string; externalReference: string; successUrl: string; pendingUrl: string; failureUrl: string; notificationUrl: string }`
  - `type MercadoPagoPayment = { id: string; status: string; transactionAmount: number | null; currencyId: string | null; externalReference: string | null; payerEmail: string | null; payerName: string | null }`
  - `getMercadoPagoServerConfig(): { accessToken: string }`
  - `getMercadoPagoWebhookSecret(): string`
  - `getOptionalPublicMercadoPagoPublicKey(): string`

- [ ] **Step 1: Escrever os testes que falham**

Criar `lib/mercadopago.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { createHmac } from "node:crypto"
import {
    toMercadoPagoAmount,
    fromMercadoPagoAmount,
    verifyMercadoPagoSignature,
} from "./mercadopago"

describe("toMercadoPagoAmount", () => {
    it("mantém o valor decimal com 2 casas", () => {
        expect(toMercadoPagoAmount(10)).toBe(10)
        expect(toMercadoPagoAmount(289.9)).toBe(289.9)
    })

    it("elimina ruído de ponto flutuante", () => {
        // 0.1 + 0.2 = 0.30000000000000004 em IEEE-754.
        expect(toMercadoPagoAmount(0.1 + 0.2)).toBe(0.3)
    })

    it("arredonda para 2 casas — o Mercado Pago recusa mais que isso em BRL", () => {
        expect(toMercadoPagoAmount(12.345)).toBe(12.35)
        expect(toMercadoPagoAmount(12.344)).toBe(12.34)
    })
})

describe("fromMercadoPagoAmount", () => {
    it("converte para string com 2 casas, formato que amountMatches exige", () => {
        expect(fromMercadoPagoAmount(289.9)).toBe("289.90")
        expect(fromMercadoPagoAmount(10)).toBe("10.00")
    })

    it("zero vira 0.00, não 0", () => {
        expect(fromMercadoPagoAmount(0)).toBe("0.00")
    })
})

const SECRET = "segredo-de-teste"

function assinar(dataId: string, requestId: string, ts: string): string {
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
    return createHmac("sha256", SECRET).update(manifest).digest("hex")
}

describe("verifyMercadoPagoSignature", () => {
    it("aceita assinatura válida", () => {
        const ts = "1754179200"
        const v1 = assinar("123456", "req-1", ts)

        expect(
            verifyMercadoPagoSignature({
                signatureHeader: `ts=${ts},v1=${v1}`,
                requestId: "req-1",
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(true)
    })

    it("aceita o header com espaços entre as partes", () => {
        const ts = "1754179200"
        const v1 = assinar("123456", "req-1", ts)

        expect(
            verifyMercadoPagoSignature({
                signatureHeader: `ts=${ts}, v1=${v1}`,
                requestId: "req-1",
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(true)
    })

    it("normaliza o dataId para minúsculas", () => {
        // O Mercado Pago documenta que IDs alfanuméricos entram em minúsculas
        // no manifesto, mesmo quando chegam maiúsculos na query.
        const ts = "1754179200"
        const v1 = assinar("abc-def", "req-1", ts)

        expect(
            verifyMercadoPagoSignature({
                signatureHeader: `ts=${ts},v1=${v1}`,
                requestId: "req-1",
                dataId: "ABC-DEF",
                secret: SECRET,
            })
        ).toBe(true)
    })

    it("rejeita quando o ts foi adulterado", () => {
        const v1 = assinar("123456", "req-1", "1754179200")

        expect(
            verifyMercadoPagoSignature({
                signatureHeader: `ts=1754179999,v1=${v1}`,
                requestId: "req-1",
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita quando o dataId não é o assinado", () => {
        const ts = "1754179200"
        const v1 = assinar("123456", "req-1", ts)

        expect(
            verifyMercadoPagoSignature({
                signatureHeader: `ts=${ts},v1=${v1}`,
                requestId: "req-1",
                dataId: "999999",
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita header ausente", () => {
        expect(
            verifyMercadoPagoSignature({
                signatureHeader: null,
                requestId: "req-1",
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita header sem v1", () => {
        expect(
            verifyMercadoPagoSignature({
                signatureHeader: "ts=1754179200",
                requestId: "req-1",
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita request-id ausente", () => {
        const ts = "1754179200"
        const v1 = assinar("123456", "req-1", ts)

        expect(
            verifyMercadoPagoSignature({
                signatureHeader: `ts=${ts},v1=${v1}`,
                requestId: null,
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita v1 de tamanho diferente sem estourar", () => {
        // timingSafeEqual lança quando os buffers têm tamanhos diferentes —
        // a função precisa comparar tamanho antes.
        expect(
            verifyMercadoPagoSignature({
                signatureHeader: "ts=1754179200,v1=abc",
                requestId: "req-1",
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(false)
    })
})
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test -- lib/mercadopago.test.ts`
Expected: FAIL — `Failed to resolve import "./mercadopago"`.

- [ ] **Step 3: Escrever `lib/mercadopago.ts`**

```ts
// lib/mercadopago.ts
//
// Cliente do Mercado Pago e conversões de valor.
//
// Cliente fino sobre fetch, não o SDK oficial: são dois endpoints, e o SDK do
// Mercado Pago tem histórico de tipagem instável — não vale acoplar o caminho
// do dinheiro a isso.
//
// Diferença importante em relação ao Stripe: o Mercado Pago trabalha com
// DECIMAL, não com a menor unidade da moeda. A conversão aqui é de
// arredondamento, não de escala.

import { createHmac, timingSafeEqual } from "node:crypto"
import { getMercadoPagoServerConfig } from "@/lib/server-env"

const API_BASE = "https://api.mercadopago.com"

/** A presença do access token é o que habilita o provedor no servidor. */
export function isMercadoPagoConfigured(): boolean {
    return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN)
}

/**
 * Decimal do domínio → decimal do Mercado Pago, com 2 casas.
 *
 * O arredondamento existe por dois motivos: o BRL não tem fração menor que o
 * centavo, e somas de ponto flutuante produzem caudas (0.1 + 0.2) que a API
 * recusa.
 */
export function toMercadoPagoAmount(value: number): number {
    return Math.round(value * 100) / 100
}

/** Valor do Mercado Pago → string com 2 casas, formato que `amountMatches` exige. */
export function fromMercadoPagoAmount(amount: number): string {
    return amount.toFixed(2)
}

/**
 * Verifica a assinatura do webhook.
 *
 * O manifesto é `id:{data.id};request-id:{x-request-id};ts:{ts};` e o hash é
 * HMAC-SHA256 em hex, comparado com o campo `v1` do header `x-signature`.
 *
 * Pura de propósito: é a peça de segurança do fluxo e precisa ser testável sem
 * rede nem servidor.
 */
export function verifyMercadoPagoSignature(params: {
    signatureHeader: string | null
    requestId: string | null
    dataId: string
    secret: string
}): boolean {
    const { signatureHeader, requestId, dataId, secret } = params

    if (!signatureHeader || !requestId) {
        return false
    }

    let ts: string | undefined
    let v1: string | undefined

    for (const part of signatureHeader.split(",")) {
        const separator = part.indexOf("=")
        if (separator === -1) continue

        const key = part.slice(0, separator).trim()
        const value = part.slice(separator + 1).trim()

        if (key === "ts") ts = value
        if (key === "v1") v1 = value
    }

    if (!ts || !v1) {
        return false
    }

    // O Mercado Pago documenta o ID em minúsculas no manifesto quando é
    // alfanumérico. Normalizar sempre é seguro: ID numérico não muda.
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`
    const expected = createHmac("sha256", secret).update(manifest).digest("hex")

    // timingSafeEqual lança quando os tamanhos diferem — comparar antes.
    if (expected.length !== v1.length) {
        return false
    }

    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
}

export type CreatePreferenceInput = {
    items: Array<{ id: string; title: string; quantity: number; unitPrice: number }>
    payerEmail: string
    /** Nosso purchase.id — é ele que amarra o pagamento ao pedido. */
    externalReference: string
    successUrl: string
    pendingUrl: string
    failureUrl: string
    notificationUrl: string
}

export type MercadoPagoPayment = {
    id: string
    status: string
    transactionAmount: number | null
    currencyId: string | null
    externalReference: string | null
    payerEmail: string | null
    payerName: string | null
}

async function mercadoPagoFetch(path: string, init?: RequestInit): Promise<unknown> {
    const { accessToken } = getMercadoPagoServerConfig()

    const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...init?.headers,
        },
    })

    if (!response.ok) {
        // O corpo do erro traz a causa (moeda inválida, item sem preço). Sem
        // ele, todo problema de integração vira "500" sem pista.
        const body = await response.text()
        throw new Error(`Mercado Pago ${response.status} em ${path}: ${body}`)
    }

    return response.json()
}

/**
 * Cria a preferência do Checkout Pro.
 *
 * `currency_id` é sempre BRL: a conta é brasileira e o Mercado Pago NÃO
 * converte — mandar outro código de moeda cobraria o mesmo número em reais,
 * sem erro de API.
 *
 * Os meios de pagamento não são listados, apenas excluídos: método novo que o
 * Mercado Pago lançar entra sozinho, em vez de sumir sem ninguém notar. Boleto
 * (`ticket`) fica de fora — 3 dias úteis de compensação não combinam com
 * produto de entrega imediata.
 */
export async function createPreference(
    input: CreatePreferenceInput
): Promise<{ id: string; initPoint: string }> {
    const body = {
        items: input.items.map((item) => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            unit_price: toMercadoPagoAmount(item.unitPrice),
            currency_id: "BRL",
        })),
        payer: { email: input.payerEmail },
        external_reference: input.externalReference,
        back_urls: {
            success: input.successUrl,
            pending: input.pendingUrl,
            failure: input.failureUrl,
        },
        notification_url: input.notificationUrl,
        payment_methods: {
            excluded_payment_types: [{ id: "ticket" }],
        },
    }

    const data = (await mercadoPagoFetch("/checkout/preferences", {
        method: "POST",
        body: JSON.stringify(body),
    })) as { id?: string; init_point?: string }

    if (!data.id || !data.init_point) {
        throw new Error("Mercado Pago devolveu preferência sem id ou init_point")
    }

    return { id: data.id, initPoint: data.init_point }
}

/**
 * Busca um pagamento. É obrigatório: o webhook entrega SÓ o ID, e status,
 * valor e vínculo com o pedido só existem aqui.
 */
export async function getPayment(paymentId: string): Promise<MercadoPagoPayment> {
    const data = (await mercadoPagoFetch(`/v1/payments/${paymentId}`)) as {
        id?: number | string
        status?: string
        transaction_amount?: number
        currency_id?: string
        external_reference?: string
        payer?: { email?: string; first_name?: string; last_name?: string }
    }

    const nome = [data.payer?.first_name, data.payer?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim()

    return {
        id: String(data.id ?? paymentId),
        status: data.status ?? "unknown",
        transactionAmount: data.transaction_amount ?? null,
        currencyId: data.currency_id ?? null,
        externalReference: data.external_reference ?? null,
        payerEmail: data.payer?.email ?? null,
        payerName: nome || null,
    }
}
```

- [ ] **Step 4: Acrescentar os getters de ambiente**

Ao final de `lib/server-env.ts`:

```ts
export function getMercadoPagoServerConfig() {
    return {
        accessToken: getRequiredServerEnv("MERCADOPAGO_ACCESS_TOKEN"),
    }
}

/**
 * Getter próprio, mesmo motivo do Stripe: a rota de criação de preferência não
 * pode falhar por causa de uma variável que só o webhook usa.
 */
export function getMercadoPagoWebhookSecret(): string {
    return getRequiredServerEnv("MERCADOPAGO_WEBHOOK_SECRET")
}
```

Em `lib/env.ts`, acrescentar a chave ao objeto `publicEnv` (após a linha `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`):

```ts
    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
```

E ao final do arquivo:

```ts
/**
 * Sinal público de "Mercado Pago habilitado" para a UI, espelhando o padrão de
 * PayPal e Stripe. O Checkout Pro é hospedado e não usa a public key no
 * client, mas manter o par documentado evita configuração pela metade.
 */
export function getOptionalPublicMercadoPagoPublicKey() {
    return publicEnv.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || ""
}
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `npm test -- lib/mercadopago.test.ts`
Expected: PASS — 13 testes.

- [ ] **Step 6: Rodar o lint**

Run: `npm run lint`
Expected: sem erros nos arquivos tocados.

- [ ] **Step 7: Commit**

```bash
git add lib/mercadopago.ts lib/mercadopago.test.ts lib/server-env.ts lib/env.ts
git commit -m "feat(mercadopago): cliente, conversão de valor e verificação de assinatura"
```

---

### Task 2: Provedor no schema e no fulfillment

O enum, os campos e a troca do ternário por um mapa explícito de provedor → cláusula de busca.

**Files:**
- Modify: `prisma/schema.prisma` (enum `PaymentProvider` e model `Purchase`)
- Create: `prisma/migrations/<timestamp>_add_mercadopago_provider/migration.sql` (gerada pelo Prisma)
- Modify: `lib/checkout/fulfillment.ts:28`, `:65-121`
- Modify: `lib/checkout/fulfillment.test.ts` (acrescentar casos)

**Interfaces:**
- Consumes: nada da Task 1.
- Produces:
  - `PaymentProviderInput` passa a ser `"paypal" | "stripe" | "mercadopago"`
  - `fulfillPurchase(db, { provider: "mercadopago", providerOrderId, capturedAmount, payer, providerPaymentId })` onde `providerOrderId` é o **`purchase.id`**
  - Campos Prisma: `Purchase.mercadoPagoPreferenceId` (`String? @unique`), `Purchase.mercadoPagoPaymentId` (`String?`)

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar ao final de `describe("fulfillPurchase", ...)` em `lib/checkout/fulfillment.test.ts`:

```ts
    it("mercadopago: localiza a compra pelo próprio purchase.id", async () => {
        // O webhook do Mercado Pago entrega só o ID do pagamento; quem amarra
        // o pagamento ao pedido é o external_reference, que É o nosso id.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue({ ...pendingPurchase, currency: "BRL", total: "289.00" })
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "mercadopago",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "289.00", currency: "BRL" },
            payer: { email: "comprador@teste.com", name: "Comprador" },
            providerPaymentId: "mp-pay-1",
        })

        expect(db.purchase.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: "purchase-1" } })
        )
        expect(outcome.status).toBe("fulfilled")
    })

    it("mercadopago: grava mercadoPagoPaymentId e nenhum campo dos outros provedores", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue({ ...pendingPurchase, currency: "BRL", total: "289.00" })
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "mercadopago",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "289.00", currency: "BRL" },
            providerPaymentId: "mp-pay-1",
        })

        const [updateArgs] = db.purchase.updateMany.mock.calls[0]
        expect(updateArgs.data).toMatchObject({
            status: "paid",
            mercadoPagoPaymentId: "mp-pay-1",
        })
        expect(updateArgs.data).not.toHaveProperty("paypalPayerId")
        expect(updateArgs.data).not.toHaveProperty("stripePaymentIntentId")
    })

    it("mercadopago: valor em moeda diferente de BRL não efetiva", async () => {
        // Rede de proteção contra o modo de falha central do Mercado Pago:
        // ele não converte, então um valor rotulado EUR sobre compra em BRL
        // significa que alguma coisa a montante montou o pedido errado.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue({ ...pendingPurchase, currency: "BRL", total: "289.00" })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "mercadopago",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "289.00", currency: "EUR" },
        })

        expect(outcome).toEqual({ status: "amount_mismatch", purchaseId: "purchase-1" })
        expect(db.purchase.updateMany).not.toHaveBeenCalled()
    })
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test -- lib/checkout/fulfillment.test.ts`
Expected: FAIL nos 3 testes novos — `findUnique` chamado com `{ stripeSessionId: "purchase-1" }`, porque o ternário manda tudo que não é paypal para o Stripe. É exatamente o erro silencioso que o mapa elimina.

- [ ] **Step 3: Atualizar o schema Prisma**

Em `prisma/schema.prisma`, no enum:

```prisma
enum PaymentProvider {
  paypal
  stripe
  mercadopago
}
```

E no model `Purchase`, junto dos campos dos outros provedores:

```prisma
  mercadoPagoPreferenceId String? @unique
  mercadoPagoPaymentId    String?
```

- [ ] **Step 4: Gerar e aplicar a migration**

Run: `npx prisma migrate dev --name add_mercadopago_provider --create-only`

Conferir o SQL gerado — deve conter `ALTER TYPE "PaymentProvider" ADD VALUE 'mercadopago'` e duas colunas novas com índice único em `mercadoPagoPreferenceId`. Depois:

Run: `npx prisma migrate deploy`
Run: `npx prisma generate`
Expected: migration aplicada, client regenerado com o valor novo do enum.

- [ ] **Step 5: Trocar o ternário pelo mapa em `lib/checkout/fulfillment.ts`**

Substituir o tipo (linha 28):

```ts
export type PaymentProviderInput = "paypal" | "stripe" | "mercadopago"
```

Acrescentar acima de `fulfillPurchase`:

```ts
/**
 * Como localizar a compra a partir do identificador que cada provedor
 * devolve.
 *
 * O Mercado Pago é o caso diferente: o webhook dele entrega só o ID do
 * pagamento, e o que amarra o pagamento ao pedido é o `external_reference` —
 * que É o nosso purchase.id. Um ternário aqui mandaria silenciosamente todo
 * provedor novo para a busca do Stripe.
 */
const BUSCA_POR_PROVEDOR: Record<
    PaymentProviderInput,
    (providerOrderId: string) => { paypalOrderId: string } | { stripeSessionId: string } | { id: string }
> = {
    paypal: (id) => ({ paypalOrderId: id }),
    stripe: (id) => ({ stripeSessionId: id }),
    mercadopago: (id) => ({ id }),
}
```

Trocar o `where` do `findUnique` (linhas 80-83) por:

```ts
        where: BUSCA_POR_PROVEDOR[provider](providerOrderId),
```

E acrescentar o campo do Mercado Pago ao `data` do `updateMany`, junto dos outros dois:

```ts
            ...(provider === "mercadopago" && providerPaymentId
                ? { mercadoPagoPaymentId: providerPaymentId }
                : {}),
```

- [ ] **Step 6: Rodar os testes e confirmar que passam**

Run: `npm test -- lib/checkout/fulfillment.test.ts`
Expected: PASS — os testes antigos de paypal e stripe continuam verdes, mais os 3 novos.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations lib/checkout/fulfillment.ts lib/checkout/fulfillment.test.ts
git commit -m "feat(mercadopago): provedor no schema e busca por provedor no fulfillment"
```

---

### Task 3: Preço em BRL obrigatório

Sem preço em BRL a lista não pode ser cobrada. Esta task fecha a porta na escrita e dá visibilidade sobre o passivo existente.

**Files:**
- Modify: `lib/marketplace/list-prices.ts:81-98` (`writeListPrices`)
- Modify: `lib/marketplace/list-prices.test.ts` (acrescentar casos)
- Modify: `actions/admin/lists.ts:47-51` (schema zod)
- Modify: `components/admin/list-form.tsx:118` e `:705`
- Modify: `prisma/check-precos.ts`
- Modify: `messages/{pt,en,de,fr,es,it,nl}.json` (chave `validationPriceBrl`, e `priceOptionalNote`)

**Interfaces:**
- Consumes: nada.
- Produces: `writeListPrices` lança `Error` quando `amounts.BRL` é `undefined`. Nenhuma assinatura muda.

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar em `lib/marketplace/list-prices.test.ts`:

```ts
describe("writeListPrices — moedas obrigatórias", () => {
    function createMockDb() {
        return {
            leadListPrice: { upsert: vi.fn(), deleteMany: vi.fn() },
            leadList: { update: vi.fn() },
            $transaction: vi.fn(),
        }
    }

    it("recusa lista sem preço em BRL", async () => {
        const db = createMockDb()

        await expect(
            writeListPrices(db as never, "lista-1", { EUR: 45 })
        ).rejects.toThrow(/BRL/)

        expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("recusa lista sem preço em EUR", async () => {
        const db = createMockDb()

        await expect(
            writeListPrices(db as never, "lista-1", { BRL: 289 })
        ).rejects.toThrow(/EUR/)

        expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("aceita EUR e BRL, com USD opcional", async () => {
        const db = createMockDb()
        db.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
            await fn({
                leadListPrice: { upsert: vi.fn(), deleteMany: vi.fn() },
                leadList: { update: vi.fn() },
            })
        })

        await expect(
            writeListPrices(db as never, "lista-1", { EUR: 45, BRL: 289 })
        ).resolves.toBeUndefined()

        expect(db.$transaction).toHaveBeenCalled()
    })
})
```

Garantir que o arquivo importa `vi` e `writeListPrices`:

```ts
import { describe, it, expect, vi } from "vitest"
import { pickPrice, resolveListPrices, writeListPrices, cartCurrencyFor, roundCommercial } from "./list-prices"
```

(Ajustar a linha de import existente para incluir apenas o que já é usado mais `writeListPrices` e `vi`.)

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test -- lib/marketplace/list-prices.test.ts`
Expected: FAIL em "recusa lista sem preço em BRL" — hoje `writeListPrices` só exige EUR.

- [ ] **Step 3: Exigir BRL em `writeListPrices`**

Substituir o bloco de validação em `lib/marketplace/list-prices.ts` (linhas 86-89):

```ts
    // EUR é a moeda de referência da exibição; BRL é a moeda em que o dinheiro
    // efetivamente entra — o Mercado Pago, único provedor ativo, cobra sempre
    // em reais. Lista sem um dos dois é lista que ninguém consegue comprar.
    const eur = amounts[DEFAULT_CURRENCY]
    if (eur === undefined) {
        throw new Error("Preço em EUR é obrigatório: é a moeda de referência da lista.")
    }

    if (amounts.BRL === undefined) {
        throw new Error("Preço em BRL é obrigatório: é a moeda em que a cobrança acontece.")
    }
```

Atualizar o comentário do JSDoc da função, trocando a última linha:

```
 * Moeda ausente do objeto = a lista deixa de ter preço nela (a linha é
 * apagada). EUR e BRL nunca podem ser ausentes.
```

- [ ] **Step 4: Exigir BRL no schema da action**

Em `actions/admin/lists.ts`, substituir o bloco `prices` do zod (linhas 46-51):

```ts
    // EUR é a moeda de referência e o fallback da vitrine; BRL é a moeda da
    // cobrança (o Mercado Pago só cobra em reais). Os dois são obrigatórios.
    prices: z.object({
        EUR: z.number().finite().positive().max(999999),
        BRL: z.number().finite().positive().max(999999),
        USD: z.number().finite().positive().max(999999).optional(),
    }),
```

E no `interface CreateListData` (linhas 27-31):

```ts
    prices: {
        EUR: number
        BRL: number
        USD?: number
    }
```

- [ ] **Step 5: Exigir BRL no formulário**

Em `components/admin/list-form.tsx`, linha 118, trocar:

```ts
        priceBRL: z.string().min(1, t("validationPriceBrl")),
```

E na linha ~705, trocar a nota `priceOptionalNote` — o texto passa a dizer que EUR e BRL são obrigatórios e USD é opcional (chave já existente, só muda a tradução no Step 6).

Conferir que o `onSubmit` (linha ~238) continua passando `BRL: optionalPrice(priceBRL)`. Trocar por conversão direta, já que agora é obrigatório:

```ts
                    BRL: parseFloat(priceBRL),
```

- [ ] **Step 6: Traduzir as chaves nos 7 idiomas**

Na seção do formulário de listas do admin em cada `messages/*.json`, acrescentar `validationPriceBrl` e substituir `priceOptionalNote`:

| arquivo | `validationPriceBrl` | `priceOptionalNote` |
|---|---|---|
| `pt.json` | `"Preço em BRL é obrigatório"` | `"EUR e BRL são obrigatórios. USD é opcional."` |
| `en.json` | `"BRL price is required"` | `"EUR and BRL are required. USD is optional."` |
| `de.json` | `"BRL-Preis ist erforderlich"` | `"EUR und BRL sind erforderlich. USD ist optional."` |
| `fr.json` | `"Le prix en BRL est obligatoire"` | `"EUR et BRL sont obligatoires. USD est facultatif."` |
| `es.json` | `"El precio en BRL es obligatorio"` | `"EUR y BRL son obligatorios. USD es opcional."` |
| `it.json` | `"Il prezzo in BRL è obbligatorio"` | `"EUR e BRL sono obbligatori. USD è facoltativo."` |
| `nl.json` | `"BRL-prijs is verplicht"` | `"EUR en BRL zijn verplicht. USD is optioneel."` |

- [ ] **Step 7: Estender o script de integridade**

Em `prisma/check-precos.ts`, acrescentar a verificação de BRL. Depois da constante `DEFAULT_CURRENCY`:

```ts
const CHARGE_CURRENCY = "BRL"
```

Dentro de `main()`, após o bloco `semEuro`:

```ts
    const semReal = await prisma.leadList.findMany({
        where: { isActive: true, prices: { none: { currency: CHARGE_CURRENCY } } },
        select: { slug: true },
    })
```

E depois do bloco de relatório do euro:

```ts
    if (semReal.length > 0) {
        falhou = true
        console.error(`✖ ${semReal.length} lista(s) ativa(s) sem preço em BRL:`)
        for (const l of semReal) console.error(`   - ${l.slug}`)
        console.error("  BRL é a moeda da cobrança: o Mercado Pago só cobra em reais.")
        console.error("  Sem essa linha a lista aparece na vitrine mas não pode ser comprada.")
    } else {
        console.log(`✓ ${lists.length} lista(s) ativa(s), todas com preço em BRL`)
    }
```

Atualizar o comentário de cabeçalho do arquivo para descrever a terceira invariante.

- [ ] **Step 8: Rodar os testes e o script**

Run: `npm test -- lib/marketplace/list-prices.test.ts`
Expected: PASS.

Run: `npm run check:precos`
Expected: relatório listando quantas listas ativas estão sem preço em BRL. **Anotar o número e informar ao Werner** — cadastrar esses preços é trabalho manual pelo formulário do admin e é bloqueante para vender.

- [ ] **Step 9: Commit**

```bash
git add lib/marketplace/list-prices.ts lib/marketplace/list-prices.test.ts actions/admin/lists.ts components/admin/list-form.tsx prisma/check-precos.ts messages/
git commit -m "feat(precos): torna BRL obrigatório, moeda em que a cobrança acontece"
```

---

### Task 4: Rotas de cotação e criação de preferência

O caminho de ida: calcular o total em BRL e criar a preferência.

**Files:**
- Create: `app/api/checkout/mercadopago/quote/route.ts`
- Create: `app/api/checkout/mercadopago/create-preference/route.ts`

**Interfaces:**
- Consumes: `createPreference`, `isMercadoPagoConfigured` (Task 1); `Purchase.mercadoPagoPreferenceId`, provider `mercadopago` (Task 2); `resolveListPrices` com `"BRL"` (Task 3).
- Produces:
  - `POST /api/checkout/mercadopago/quote` → `200 { total: number, currency: "BRL" }`
  - `POST /api/checkout/mercadopago/create-preference` → `200 { url: string, purchaseId: string }`

- [ ] **Step 1: Criar a rota de cotação**

Criar `app/api/checkout/mercadopago/quote/route.ts`:

```ts
// app/api/checkout/mercadopago/quote/route.ts
//
// Total do carrinho em BRL, para o checkout poder dizer ao comprador quanto
// vai ser cobrado ANTES de ele sair do site.
//
// Existe porque o Mercado Pago cobra sempre em reais, inclusive para quem está
// vendo preço em EUR ou USD. Mostrar um valor e cobrar outro sem avisar é a
// falha que este endpoint existe para evitar — e o número tem que vir do
// servidor, como todo preço neste projeto.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getClientIp, checkPersistentRateLimit } from "@/lib/rate-limit"
import { checkoutRequestSchema } from "@/lib/checkout/request-schema"
import { resolveListPrices } from "@/lib/marketplace/list-prices"
import { isMercadoPagoConfigured } from "@/lib/mercadopago"

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!isMercadoPagoConfigured()) {
            return NextResponse.json({ error: "Mercado Pago not configured" }, { status: 503 })
        }

        const allowed = await checkPersistentRateLimit(
            "checkout:quote",
            user.id || getClientIp(request),
            30,
            60_000
        )
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 })
        }

        const parsedBody = checkoutRequestSchema.safeParse(await request.json())

        if (!parsedBody.success) {
            return NextResponse.json({ error: "Invalid checkout items" }, { status: 400 })
        }

        const { items } = parsedBody.data
        const listIds = items.map((item) => item.listId)

        const lists = await prisma.leadList.findMany({
            where: { id: { in: listIds }, isActive: true },
            select: { id: true },
        })

        if (lists.length !== items.length) {
            return NextResponse.json({ error: "Invalid items" }, { status: 400 })
        }

        // A moeda do corpo é ignorada de propósito: a cotação é sempre em BRL,
        // porque a cobrança é sempre em BRL.
        const prices = await resolveListPrices(prisma, listIds, "BRL")

        const semPreco = lists.filter((list) => prices.get(list.id)?.currency !== "BRL")
        if (semPreco.length > 0) {
            return NextResponse.json(
                { error: "Item without price in BRL" },
                { status: 400 }
            )
        }

        let total = 0
        for (const item of items) {
            total += prices.get(item.listId)!.amount * item.quantity
        }

        return NextResponse.json({ total, currency: "BRL" })
    } catch (error) {
        console.error("Error quoting Mercado Pago cart:", error)
        return NextResponse.json({ error: "Failed to quote" }, { status: 500 })
    }
}
```

- [ ] **Step 2: Criar a rota de preferência**

Criar `app/api/checkout/mercadopago/create-preference/route.ts`:

```ts
// app/api/checkout/mercadopago/create-preference/route.ts
//
// Cria a Purchase pendente e a preferência do Checkout Pro.
//
// A ordem é INVERTIDA em relação ao Stripe, e de propósito: o webhook do
// Mercado Pago entrega só o ID do pagamento, e quem amarra o pagamento ao
// pedido é o `external_reference` — que é o nosso purchase.id. Ele precisa
// existir antes da preferência.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getPublicAppUrl } from "@/lib/env"
import { getClientIp, checkPersistentRateLimit } from "@/lib/rate-limit"
import { createPreference, isMercadoPagoConfigured } from "@/lib/mercadopago"
import { checkoutRequestSchema } from "@/lib/checkout/request-schema"
import { resolveListPrices } from "@/lib/marketplace/list-prices"

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!isMercadoPagoConfigured()) {
            return NextResponse.json({ error: "Mercado Pago not configured" }, { status: 503 })
        }

        // Mesmo bucket de rate limit dos outros provedores: o teto é do
        // checkout, não de cada provedor.
        const allowed = await checkPersistentRateLimit(
            "checkout:create",
            user.id || getClientIp(request),
            10,
            60_000
        )
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 })
        }

        const PENDING_BACKSTOP_MAX = 15
        const PENDING_BACKSTOP_WINDOW_MS = 60 * 60 * 1000
        const recentPending = await prisma.purchase.count({
            where: {
                userId: user.id,
                status: "pending",
                createdAt: { gt: new Date(Date.now() - PENDING_BACKSTOP_WINDOW_MS) },
            },
        })
        if (recentPending >= PENDING_BACKSTOP_MAX) {
            return NextResponse.json({ error: "Too many pending orders" }, { status: 429 })
        }

        const parsedBody = checkoutRequestSchema.safeParse(await request.json())

        if (!parsedBody.success) {
            return NextResponse.json({ error: "Invalid checkout items" }, { status: 400 })
        }

        const { items } = parsedBody.data
        const listIds = items.map((item) => item.listId)

        const lists = await prisma.leadList.findMany({
            where: { id: { in: listIds }, isActive: true },
        })

        if (lists.length !== items.length) {
            return NextResponse.json({ error: "Invalid items" }, { status: 400 })
        }

        // A moeda do carrinho não entra aqui. O Mercado Pago cobra em BRL e não
        // converte: mandar o número de outra moeda cobraria aquele número em
        // reais, sem erro de API.
        const prices = await resolveListPrices(prisma, listIds, "BRL")

        // Sem queda para EUR: a queda é comportamento de vitrine, e cobrar numa
        // moeda diferente da resolvida é cobrar diferente do combinado.
        const semPreco = lists.filter((list) => prices.get(list.id)?.currency !== "BRL")
        if (semPreco.length > 0) {
            return NextResponse.json(
                { error: "Item without price in BRL" },
                { status: 400 }
            )
        }

        let subtotal = 0
        const purchaseItems = lists.map((list) => {
            const quantity = items.find((item) => item.listId === list.id)?.quantity ?? 1
            const unitPrice = prices.get(list.id)!.amount
            subtotal += unitPrice * quantity

            return {
                listId: list.id,
                name: list.name,
                price: unitPrice,
                quantity,
                leadsCount: list.totalLeads,
            }
        })

        // A compra nasce ANTES da preferência: o external_reference é o id dela.
        const purchase = await prisma.purchase.create({
            data: {
                userId: user.id,
                provider: "mercadopago",
                status: "pending",
                subtotal,
                total: subtotal,
                currency: "BRL",
                buyerEmail: user.email,
                items: {
                    create: purchaseItems.map((item) => ({
                        listId: item.listId,
                        price: item.price,
                        currency: "BRL",
                        leadsCount: item.leadsCount,
                    })),
                },
            },
        })

        const appUrl = getPublicAppUrl()

        let preference: { id: string; initPoint: string }
        try {
            preference = await createPreference({
                items: purchaseItems.map((item) => ({
                    id: item.listId,
                    title: item.name,
                    quantity: item.quantity,
                    unitPrice: item.price,
                })),
                payerEmail: user.email,
                externalReference: purchase.id,
                successUrl: `${appUrl}/checkout/mercadopago-return`,
                pendingUrl: `${appUrl}/checkout/mercadopago-return`,
                failureUrl: `${appUrl}/checkout/cancel`,
                notificationUrl: `${appUrl}/api/checkout/mercadopago/webhook`,
            })
        } catch (error) {
            // Compra criada sem preferência é pedido órfão: ela ocuparia o
            // backstop de pendentes do comprador sem nunca poder ser paga.
            console.error("[Mercado Pago] Falha ao criar preferência:", error)
            await prisma.purchase.updateMany({
                where: { id: purchase.id, status: "pending" },
                data: { status: "failed" },
            })
            return NextResponse.json({ error: "Failed to create preference" }, { status: 500 })
        }

        await prisma.purchase.update({
            where: { id: purchase.id },
            data: { mercadoPagoPreferenceId: preference.id },
        })

        return NextResponse.json({
            url: preference.initPoint,
            purchaseId: purchase.id,
        })
    } catch (error) {
        console.error("Error creating Mercado Pago preference:", error)
        return NextResponse.json({ error: "Failed to create preference" }, { status: 500 })
    }
}
```

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npm run lint`
Expected: sem erros.

- [ ] **Step 4: Rodar a suíte inteira**

Run: `npm test`
Expected: PASS — nada quebrou.

- [ ] **Step 5: Commit**

```bash
git add app/api/checkout/mercadopago/
git commit -m "feat(mercadopago): rotas de cotação em BRL e criação de preferência"
```

---

### Task 5: Webhook e ciclo do Pix

Esta é a task com o comportamento que não existe hoje. Com Pix, o comprador sai do site e volta minutos depois — ou não volta. O webhook deixa de ser rede de reconciliação e passa a ser o caminho principal.

**Files:**
- Create: `app/api/checkout/mercadopago/webhook/route.ts`
- Create: `lib/checkout/mercadopago-status.ts`
- Create: `lib/checkout/mercadopago-status.test.ts`

**Interfaces:**
- Consumes: `verifyMercadoPagoSignature`, `getPayment`, `fromMercadoPagoAmount` (Task 1); `fulfillPurchase` com `provider: "mercadopago"` (Task 2).
- Produces: `mapPaymentStatus(status: string): "fulfill" | "ignore" | "fail"`

- [ ] **Step 1: Escrever o teste do mapeamento de status**

Criar `lib/checkout/mercadopago-status.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { mapPaymentStatus } from "./mercadopago-status"

describe("mapPaymentStatus", () => {
    it("approved efetiva a compra", () => {
        expect(mapPaymentStatus("approved")).toBe("fulfill")
    })

    it("estados intermediários não fazem nada", () => {
        // Pix nasce pending: o comprador ainda está no app do banco. O Mercado
        // Pago reenvia o evento quando aprovar.
        expect(mapPaymentStatus("pending")).toBe("ignore")
        expect(mapPaymentStatus("in_process")).toBe("ignore")
        expect(mapPaymentStatus("authorized")).toBe("ignore")
        expect(mapPaymentStatus("in_mediation")).toBe("ignore")
    })

    it("recusa e cancelamento marcam falha", () => {
        expect(mapPaymentStatus("rejected")).toBe("fail")
        expect(mapPaymentStatus("cancelled")).toBe("fail")
    })

    it("estorno e chargeback ficam fora deste fluxo", () => {
        // Reembolso não é escopo deste trabalho: marcar failed apagaria o
        // registro de uma compra que foi paga de verdade.
        expect(mapPaymentStatus("refunded")).toBe("ignore")
        expect(mapPaymentStatus("charged_back")).toBe("ignore")
    })

    it("status desconhecido não faz nada", () => {
        expect(mapPaymentStatus("status_que_o_mp_inventou")).toBe("ignore")
    })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- lib/checkout/mercadopago-status.test.ts`
Expected: FAIL — `Failed to resolve import "./mercadopago-status"`.

- [ ] **Step 3: Escrever o mapeamento**

Criar `lib/checkout/mercadopago-status.ts`:

```ts
// lib/checkout/mercadopago-status.ts
//
// Tradução do status de pagamento do Mercado Pago para a ação do nosso
// domínio. Separada da rota porque é a regra que o Pix tornou não-trivial e
// que precisa de teste sem rede.

export type PaymentAction = "fulfill" | "ignore" | "fail"

const ACOES: Record<string, PaymentAction> = {
    approved: "fulfill",

    // O comprador ainda está no app do banco (Pix) ou o cartão está em
    // análise. O Mercado Pago reenvia o evento quando resolver.
    pending: "ignore",
    in_process: "ignore",
    authorized: "ignore",
    in_mediation: "ignore",

    rejected: "fail",
    cancelled: "fail",

    // Estorno e chargeback são posteriores a um pagamento real. Tratá-los aqui
    // como falha apagaria o registro de uma compra que aconteceu.
    refunded: "ignore",
    charged_back: "ignore",
}

/** Status desconhecido nunca altera a compra — o padrão seguro é não agir. */
export function mapPaymentStatus(status: string): PaymentAction {
    return ACOES[status] ?? "ignore"
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- lib/checkout/mercadopago-status.test.ts`
Expected: PASS — 5 testes.

- [ ] **Step 5: Escrever o webhook**

Criar `app/api/checkout/mercadopago/webhook/route.ts`:

```ts
// app/api/checkout/mercadopago/webhook/route.ts
//
// Recebe as notificações do Mercado Pago.
//
// Diferente do Stripe, aqui o webhook é o caminho PRINCIPAL, não a rede: com
// Pix o comprador sai do site para o app do banco e pode nunca voltar à aba.
//
// A notificação entrega apenas o ID do pagamento — status, valor e vínculo com
// o pedido só existem depois do GET. O que amarra o pagamento ao pedido é o
// external_reference, que é o nosso purchase.id.
//
// A verificação de assinatura é obrigatória e fail-closed.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fulfillPurchase, type CapturedAmount } from "@/lib/checkout/fulfillment"
import { mapPaymentStatus } from "@/lib/checkout/mercadopago-status"
import {
    getPayment,
    fromMercadoPagoAmount,
    verifyMercadoPagoSignature,
} from "@/lib/mercadopago"
import { getMercadoPagoWebhookSecret } from "@/lib/server-env"

export const dynamic = "force-dynamic"

type WebhookBody = {
    type?: string
    action?: string
    data?: { id?: string | number }
}

export async function POST(request: NextRequest) {
    let secret: string
    try {
        secret = getMercadoPagoWebhookSecret()
    } catch {
        console.warn("[Mercado Pago Webhook] MERCADOPAGO_WEBHOOK_SECRET não configurado — evento rejeitado")
        return NextResponse.json({ error: "Webhook not configured" }, { status: 401 })
    }

    let body: WebhookBody
    try {
        body = (await request.json()) as WebhookBody
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    // O `data.id` da assinatura vem da query string quando presente; o Mercado
    // Pago manda os dois caminhos e a query tem precedência na documentação.
    const dataId = request.nextUrl.searchParams.get("data.id") ?? String(body.data?.id ?? "")

    if (!dataId) {
        return NextResponse.json({ error: "Missing payment id" }, { status: 400 })
    }

    const valida = verifyMercadoPagoSignature({
        signatureHeader: request.headers.get("x-signature"),
        requestId: request.headers.get("x-request-id"),
        dataId,
        secret,
    })

    if (!valida) {
        console.error("[Mercado Pago Webhook] Assinatura inválida para data.id=", dataId)
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Só notificação de pagamento interessa. As demais são confirmadas com 200
    // para o Mercado Pago parar de reentregar.
    if (body.type && body.type !== "payment") {
        return NextResponse.json({ received: true })
    }

    try {
        const payment = await getPayment(dataId)

        if (!payment.externalReference) {
            console.error(`[Mercado Pago Webhook] Pagamento ${payment.id} sem external_reference`)
            return NextResponse.json({ received: true })
        }

        const acao = mapPaymentStatus(payment.status)

        if (acao === "ignore") {
            console.log(
                `[Mercado Pago Webhook] pagamento=${payment.id} status=${payment.status} — nenhuma ação`
            )
            return NextResponse.json({ received: true })
        }

        if (acao === "fail") {
            // Só falha compra ainda pendente — nunca uma já paga.
            await prisma.purchase.updateMany({
                where: { id: payment.externalReference, status: "pending" },
                data: { status: "failed" },
            })
            console.log(
                `[Mercado Pago Webhook] pagamento=${payment.id} status=${payment.status} — compra marcada failed`
            )
            return NextResponse.json({ received: true })
        }

        const capturedAmount: CapturedAmount | null =
            payment.transactionAmount == null || !payment.currencyId
                ? null
                : {
                      value: fromMercadoPagoAmount(payment.transactionAmount),
                      currency: payment.currencyId.toUpperCase(),
                  }

        const outcome = await fulfillPurchase(prisma, {
            provider: "mercadopago",
            providerOrderId: payment.externalReference,
            capturedAmount,
            payer: { email: payment.payerEmail, name: payment.payerName },
            providerPaymentId: payment.id,
        })

        console.log(
            `[Mercado Pago Webhook] pagamento=${payment.id} compra=${payment.externalReference} outcome=${outcome.status}`
        )

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("[Mercado Pago Webhook] Erro ao processar evento:", error)
        // 500 faz o Mercado Pago reentregar mais tarde.
        return NextResponse.json({ error: "Processing error" }, { status: 500 })
    }
}
```

- [ ] **Step 6: Verificar tipos, lint e suíte**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/api/checkout/mercadopago/webhook lib/checkout/mercadopago-status.ts lib/checkout/mercadopago-status.test.ts
git commit -m "feat(mercadopago): webhook assinado e ciclo assíncrono do Pix"
```

---

### Task 6: Confirmação e página de retorno

O caminho rápido, para quem volta à aba. Idempotente com o webhook.

**Files:**
- Create: `app/api/checkout/mercadopago/confirm-payment/route.ts`
- Create: `app/[locale]/checkout/mercadopago-return/page.tsx`
- Modify: `messages/{pt,en,de,fr,es,it,nl}.json` (chaves `mpConfirming`, `mpConfirmFailed`, `mpPending`)

**Interfaces:**
- Consumes: `getPayment`, `fromMercadoPagoAmount` (Task 1); `fulfillPurchase` (Task 2); `mapPaymentStatus` (Task 5).
- Produces: `POST /api/checkout/mercadopago/confirm-payment` com corpo `{ purchaseId: string }` → `200 { success: true, purchaseId, accessUrl? }` ou `202 { pending: true }`.

- [ ] **Step 1: Criar a rota de confirmação**

Criar `app/api/checkout/mercadopago/confirm-payment/route.ts`:

```ts
// app/api/checkout/mercadopago/confirm-payment/route.ts
//
// Chamada pela página de retorno logo depois de o comprador pagar. Espelha
// confirm-session do Stripe: valida ownership, consulta o provedor e efetiva
// pela função compartilhada — idempotente com o webhook.
//
// Diferença do Pix: o comprador pode voltar à aba ANTES de o pagamento ser
// aprovado. Isso não é erro, é o estado normal do meio — devolve 202 e a tela
// explica que a confirmação chega por e-mail.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { fulfillPurchase, type CapturedAmount } from "@/lib/checkout/fulfillment"
import { mapPaymentStatus } from "@/lib/checkout/mercadopago-status"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getClientIp, checkPersistentRateLimit } from "@/lib/rate-limit"
import { getPayment, fromMercadoPagoAmount } from "@/lib/mercadopago"

const confirmSchema = z.object({
    purchaseId: z.string().min(1),
    paymentId: z.string().min(1).optional(),
})

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const allowed = await checkPersistentRateLimit(
            "checkout:confirm",
            user.id || getClientIp(request),
            10,
            60_000
        )
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 })
        }

        const parsedBody = confirmSchema.safeParse(await request.json())

        if (!parsedBody.success) {
            return NextResponse.json({ error: "No purchase ID" }, { status: 400 })
        }

        const { purchaseId, paymentId } = parsedBody.data

        // Autorização: impede confirmar a compra de outra pessoa. Sem filtro de
        // status — o webhook costuma vencer a corrida, e exigir "pending" aqui
        // viraria um 404 falso na tela de retorno.
        const purchase = await prisma.purchase.findFirst({
            where: { id: purchaseId, userId: user.id, provider: "mercadopago" },
            select: { id: true, status: true, mercadoPagoPaymentId: true },
        })

        if (!purchase) {
            return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
        }

        if (purchase.status === "paid") {
            return NextResponse.json({ success: true, purchaseId: purchase.id })
        }

        // Sem ID de pagamento não há o que consultar: o Pix ainda não gerou um,
        // ou o comprador voltou pela URL sem passar pelo provedor.
        const idParaConsultar = paymentId ?? purchase.mercadoPagoPaymentId
        if (!idParaConsultar) {
            return NextResponse.json({ pending: true }, { status: 202 })
        }

        const payment = await getPayment(idParaConsultar)

        // O pagamento consultado tem que ser desta compra. Sem esta checagem,
        // um paymentId de terceiro confirmaria o pedido de quem chamou.
        if (payment.externalReference !== purchase.id) {
            return NextResponse.json({ error: "Payment does not match purchase" }, { status: 400 })
        }

        const acao = mapPaymentStatus(payment.status)

        if (acao !== "fulfill") {
            // Não marcamos failed aqui: quem decide isso é o webhook, que vê o
            // estado final. A tela explica que a confirmação chega depois.
            return NextResponse.json({ pending: true }, { status: 202 })
        }

        const capturedAmount: CapturedAmount | null =
            payment.transactionAmount == null || !payment.currencyId
                ? null
                : {
                      value: fromMercadoPagoAmount(payment.transactionAmount),
                      currency: payment.currencyId.toUpperCase(),
                  }

        const outcome = await fulfillPurchase(prisma, {
            provider: "mercadopago",
            providerOrderId: purchase.id,
            capturedAmount,
            payer: { email: payment.payerEmail, name: payment.payerName },
            providerPaymentId: payment.id,
        })

        switch (outcome.status) {
            case "fulfilled":
                return NextResponse.json({
                    success: true,
                    purchaseId: outcome.purchaseId,
                    accessUrl: outcome.accessUrl,
                })
            case "already_fulfilled":
                return NextResponse.json({ success: true, purchaseId: outcome.purchaseId })
            case "amount_mismatch":
                return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 })
            case "not_found":
                return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
        }
    } catch (error) {
        console.error("Error confirming Mercado Pago payment:", error)
        return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 })
    }
}
```

- [ ] **Step 2: Criar a página de retorno**

Criar `app/[locale]/checkout/mercadopago-return/page.tsx`:

```tsx
// app/[locale]/checkout/mercadopago-return/page.tsx
"use client"

import { Suspense, useEffect, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports -- usado só para /sign-in, fora do segmento de locale
import { useRouter as usePlainRouter, useSearchParams } from "next/navigation"
import { Link, useRouter } from "@/lib/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { AlertCircle, Clock, Loader2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"

type ConfirmResponse = {
    success?: boolean
    pending?: boolean
    purchaseId?: string
    error?: string
}

type Estado = "confirmando" | "pendente" | "falhou"

function MercadoPagoReturnContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const plainRouter = usePlainRouter()
    const { clearCart } = useCart()
    const t = useTranslations("checkout")
    const locale = useLocale()

    // O Mercado Pago devolve external_reference (nosso purchase.id) e
    // payment_id nas back_urls.
    const purchaseId = searchParams.get("external_reference")
    const paymentId = searchParams.get("payment_id")

    const [estado, setEstado] = useState<Estado>(() =>
        purchaseId ? "confirmando" : "falhou"
    )
    const startedRef = useRef(false)

    useEffect(() => {
        // StrictMode roda o efeito duas vezes em dev. O endpoint é idempotente,
        // mas evitamos a chamada dupla visível.
        if (startedRef.current || !purchaseId) {
            return
        }
        startedRef.current = true

        async function confirm(id: string) {
            try {
                const response = await fetch("/api/checkout/mercadopago/confirm-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        purchaseId: id,
                        ...(paymentId ? { paymentId } : {}),
                    }),
                })

                const result = (await response.json()) as ConfirmResponse

                if (response.status === 401 || response.status === 403) {
                    toast.error(t("sessionExpiredOrder"))
                    plainRouter.push(`/sign-in?redirect=/my-purchases&lang=${locale}`)
                    return
                }

                // 202: o Pix ainda não caiu. Não é erro — o webhook efetiva e o
                // e-mail chega quando o banco confirmar.
                if (response.status === 202 || result.pending) {
                    clearCart()
                    setEstado("pendente")
                    return
                }

                if (!response.ok || !result.purchaseId) {
                    console.error("confirm-payment failed:", response.status, result.error)
                    setEstado("falhou")
                    return
                }

                clearCart()
                toast.success(t("paymentConfirmed"))
                router.push(`/checkout/success?purchaseId=${result.purchaseId}`)
            } catch (error) {
                console.error("confirm-payment error:", error)
                setEstado("falhou")
            }
        }

        confirm(purchaseId)
    }, [purchaseId, paymentId, router, plainRouter, clearCart, t, locale])

    if (estado === "pendente") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
                <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center">
                    <Clock className="mx-auto mb-4 h-10 w-10 text-amber-600" aria-hidden="true" />
                    <p className="mb-6 text-muted-foreground">{t("mpPending")}</p>
                    <Button asChild>
                        <Link href="/my-purchases">{t("successCtaPurchases")}</Link>
                    </Button>
                </div>
            </div>
        )
    }

    if (estado === "falhou") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
                <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center">
                    <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-600" aria-hidden="true" />
                    <p className="mb-6 text-muted-foreground">{t("mpConfirmFailed")}</p>
                    <Button asChild>
                        <Link href="/my-purchases">{t("successCtaPurchases")}</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                {t("mpConfirming")}
            </div>
        </div>
    )
}

export default function MercadoPagoReturnPage() {
    return (
        <Suspense>
            <MercadoPagoReturnContent />
        </Suspense>
    )
}
```

- [ ] **Step 3: Traduzir as três chaves novas**

Na seção `"checkout"` de cada `messages/*.json`, junto de `stripeConfirming`:

**pt.json**
```json
        "mpConfirming": "Confirmando seu pagamento...",
        "mpConfirmFailed": "Não conseguimos confirmar o pagamento agora. Se o valor foi debitado, sua compra aparecerá em Minhas compras assim que o Mercado Pago confirmar.",
        "mpPending": "Recebemos seu pedido e estamos aguardando a confirmação do pagamento. Assim que o Mercado Pago confirmar, enviamos um e-mail e a compra aparece em Minhas compras.",
```

**en.json**
```json
        "mpConfirming": "Confirming your payment...",
        "mpConfirmFailed": "We couldn't confirm the payment right now. If you were charged, your purchase will appear under My purchases as soon as Mercado Pago confirms it.",
        "mpPending": "We received your order and are waiting for payment confirmation. As soon as Mercado Pago confirms it, we'll send you an email and the purchase will appear under My purchases.",
```

**de.json**
```json
        "mpConfirming": "Zahlung wird bestätigt...",
        "mpConfirmFailed": "Wir konnten die Zahlung im Moment nicht bestätigen. Falls der Betrag abgebucht wurde, erscheint Ihr Kauf unter Meine Käufe, sobald Mercado Pago ihn bestätigt.",
        "mpPending": "Wir haben Ihre Bestellung erhalten und warten auf die Zahlungsbestätigung. Sobald Mercado Pago bestätigt, senden wir Ihnen eine E-Mail und der Kauf erscheint unter Meine Käufe.",
```

**fr.json**
```json
        "mpConfirming": "Confirmation de votre paiement...",
        "mpConfirmFailed": "Nous n'avons pas pu confirmer le paiement pour le moment. Si le montant a été débité, votre achat apparaîtra dans Mes achats dès que Mercado Pago l'aura confirmé.",
        "mpPending": "Nous avons reçu votre commande et attendons la confirmation du paiement. Dès que Mercado Pago confirmera, nous vous enverrons un e-mail et l'achat apparaîtra dans Mes achats.",
```

**es.json**
```json
        "mpConfirming": "Confirmando tu pago...",
        "mpConfirmFailed": "No pudimos confirmar el pago en este momento. Si se te cobró, tu compra aparecerá en Mis compras en cuanto Mercado Pago lo confirme.",
        "mpPending": "Recibimos tu pedido y estamos esperando la confirmación del pago. En cuanto Mercado Pago confirme, te enviaremos un correo y la compra aparecerá en Mis compras.",
```

**it.json**
```json
        "mpConfirming": "Conferma del pagamento in corso...",
        "mpConfirmFailed": "Non siamo riusciti a confermare il pagamento in questo momento. Se l'importo è stato addebitato, il tuo acquisto comparirà in I miei acquisti non appena Mercado Pago lo confermerà.",
        "mpPending": "Abbiamo ricevuto il tuo ordine e stiamo aspettando la conferma del pagamento. Appena Mercado Pago confermerà, ti invieremo un'e-mail e l'acquisto comparirà in I miei acquisti.",
```

**nl.json**
```json
        "mpConfirming": "Je betaling wordt bevestigd...",
        "mpConfirmFailed": "We konden de betaling nu niet bevestigen. Als het bedrag is afgeschreven, verschijnt je aankoop bij Mijn aankopen zodra Mercado Pago het bevestigt.",
        "mpPending": "We hebben je bestelling ontvangen en wachten op de betalingsbevestiging. Zodra Mercado Pago bevestigt, sturen we een e-mail en verschijnt de aankoop bij Mijn aankopen.",
```

- [ ] **Step 4: Verificar tipos, lint e suíte**

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npm run lint`
Expected: sem erros.

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/checkout/mercadopago/confirm-payment "app/[locale]/checkout/mercadopago-return" messages/
git commit -m "feat(mercadopago): confirmação no retorno e tela de pagamento pendente"
```

---

### Task 7: Checkout com o Mercado Pago e aviso de conversão

A parte que o comprador vê. Botão do Mercado Pago, aviso de cobrança em reais para carrinho em EUR/USD, e os outros dois provedores fora da tela.

**Files:**
- Create: `components/checkout/mercadopago-button.tsx`
- Modify: `app/[locale]/checkout/page.tsx:8-13`, `:40-42`, `:107-131`
- Modify: `messages/{pt,en,de,fr,es,it,nl}.json` (chaves `payWithMercadoPago`, `brlChargeNotice`)

**Interfaces:**
- Consumes: `getOptionalPublicMercadoPagoPublicKey` (Task 1); `POST /quote` e `POST /create-preference` (Task 4).
- Produces: `<MercadoPagoButton items={[{ listId, quantity }]} currency={string} />`

- [ ] **Step 1: Criar o botão**

Criar `components/checkout/mercadopago-button.tsx`:

```tsx
// components/checkout/mercadopago-button.tsx
"use client"

import { useCallback, useEffect, useState } from "react"
// eslint-disable-next-line no-restricted-imports -- usado só para /sign-in, fora do segmento de locale
import { useRouter as usePlainRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Loader2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { getOptionalPublicMercadoPagoPublicKey } from "@/lib/env"
import { formatCurrency } from "@/lib/utils"

interface MercadoPagoButtonProps {
    items: Array<{ listId: string; quantity: number }>
    /** Moeda do carrinho. A cobrança é sempre em BRL — serve para decidir o aviso. */
    currency: string
}

type QuoteResponse = { total?: number; error?: string }
type CreatePreferenceResponse = { url?: string; error?: string }

export function MercadoPagoButton({ items, currency }: MercadoPagoButtonProps) {
    const t = useTranslations("checkout")
    const locale = useLocale()
    const plainRouter = usePlainRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [totalBrl, setTotalBrl] = useState<number | null>(null)
    const [quoteFailed, setQuoteFailed] = useState(false)
    const publicKey = getOptionalPublicMercadoPagoPublicKey()

    // O carrinho em EUR/USD precisa mostrar o valor em reais ANTES do
    // redirecionamento: o Mercado Pago cobra sempre em BRL e o banco do
    // comprador é quem converte.
    const precisaAviso = currency !== "BRL"
    const itemsKey = JSON.stringify(items)

    const buscarCotacao = useCallback(async () => {
        try {
            const response = await fetch("/api/checkout/mercadopago/quote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, currency }),
            })

            const data = (await response.json()) as QuoteResponse

            if (!response.ok || typeof data.total !== "number") {
                console.error("quote failed:", response.status, data.error)
                setQuoteFailed(true)
                return
            }

            setTotalBrl(data.total)
        } catch (error) {
            console.error("quote error:", error)
            setQuoteFailed(true)
        }
        // itemsKey entra nas deps no useEffect abaixo; items é estável por render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemsKey, currency])

    useEffect(() => {
        if (!publicKey || !precisaAviso) return
        buscarCotacao()
    }, [publicKey, precisaAviso, buscarCotacao])

    if (!publicKey) {
        // Provedor desconfigurado some da tela; o aviso de "nenhum provedor"
        // é responsabilidade da página de checkout.
        return null
    }

    // Sem saber o valor em reais, não redireciona: melhor não vender que
    // mandar alguém para um número que ele não viu.
    if (precisaAviso && quoteFailed) {
        return (
            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{t("createFailed")}</p>
            </div>
        )
    }

    const aguardandoCotacao = precisaAviso && totalBrl === null

    async function handleClick() {
        setIsLoading(true)
        try {
            const response = await fetch("/api/checkout/mercadopago/create-preference", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, currency }),
            })

            const data = (await response.json()) as CreatePreferenceResponse

            if (!response.ok || !data.url) {
                console.error("create-preference failed:", response.status, data.error)

                if (response.status === 401 || response.status === 403) {
                    toast.error(t("sessionExpiredPay"))
                    plainRouter.push(`/sign-in?redirect=/checkout&lang=${locale}`)
                } else {
                    toast.error(t("createFailed"))
                }
                setIsLoading(false)
                return
            }

            // O loading fica ligado de propósito: a navegação descarrega a página.
            window.location.href = data.url
        } catch (error) {
            console.error("create-preference error:", error)
            toast.error(t("createFailed"))
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-3">
            {precisaAviso && totalBrl !== null && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                    {t("brlChargeNotice", { amount: formatCurrency(totalBrl, "BRL", locale) })}
                </div>
            )}

            <Button
                type="button"
                className="h-[45px] w-full"
                disabled={isLoading || aguardandoCotacao}
                onClick={handleClick}
            >
                {isLoading || aguardandoCotacao ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                )}
                {t("payWithMercadoPago")}
            </Button>
        </div>
    )
}
```

- [ ] **Step 2: Ligar no checkout**

Em `app/[locale]/checkout/page.tsx`, substituir os imports de provedores (linhas 8-13) por:

```tsx
import { MercadoPagoButton } from "@/components/checkout/mercadopago-button"
import { getOptionalPublicMercadoPagoPublicKey } from "@/lib/env"
```

Substituir o cálculo de `hasAnyPaymentProvider` (linhas 35-42) por:

```tsx
    // Stripe e PayPal saíram da tela — a conta do primeiro está com pendências
    // e a do segundo foi cancelada. As rotas dos dois continuam no código, e
    // religar qualquer um volta a ser questão de variável de ambiente.
    const hasAnyPaymentProvider = Boolean(getOptionalPublicMercadoPagoPublicKey())
```

Substituir o bloco dos botões (linhas 107-118) por:

```tsx
                            {hasAnyPaymentProvider ? (
                                <MercadoPagoButton items={checkoutItems} currency={currency} />
                            ) : (
```

Renomear a variável `paypalItems` (linha 55) para `checkoutItems`, já que o PayPal saiu:

```tsx
    const checkoutItems = items.map((item) => ({
        listId: item.id,
        quantity: item.quantity,
    }))
```

- [ ] **Step 3: Traduzir as duas chaves novas**

Na seção `"checkout"` de cada `messages/*.json`:

| arquivo | `payWithMercadoPago` | `brlChargeNotice` |
|---|---|---|
| `pt.json` | `"Pagar com Mercado Pago"` | `"A cobrança é feita em reais: {amount}. Se seu cartão for de outro país, o banco emissor faz a conversão."` |
| `en.json` | `"Pay with Mercado Pago"` | `"You will be charged in Brazilian reais: {amount}. If your card is from another country, your bank handles the conversion."` |
| `de.json` | `"Mit Mercado Pago bezahlen"` | `"Die Abbuchung erfolgt in brasilianischen Real: {amount}. Bei einer Karte aus einem anderen Land übernimmt Ihre Bank die Umrechnung."` |
| `fr.json` | `"Payer avec Mercado Pago"` | `"Le paiement est effectué en réals brésiliens : {amount}. Si votre carte vient d'un autre pays, votre banque effectue la conversion."` |
| `es.json` | `"Pagar con Mercado Pago"` | `"El cobro se realiza en reales brasileños: {amount}. Si tu tarjeta es de otro país, tu banco hace la conversión."` |
| `it.json` | `"Paga con Mercado Pago"` | `"L'addebito avviene in real brasiliani: {amount}. Se la tua carta è di un altro paese, la conversione è a cura della tua banca."` |
| `nl.json` | `"Betalen met Mercado Pago"` | `"Er wordt afgerekend in Braziliaanse real: {amount}. Als je kaart uit een ander land komt, verzorgt je bank de omrekening."` |

- [ ] **Step 4: Verificar tipos, lint e suíte**

Run: `npx tsc --noEmit`
Expected: sem erros. Se `StripeCheckoutButton` ou `PayPalButtonsWrapper` ficarem sem uso, o lint aponta — os arquivos permanecem no repositório, apenas deixam de ser importados pela página de checkout.

Run: `npm run lint`
Expected: sem erros.

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Verificar no navegador**

Rodar o dev server pelo preview (`.claude/launch.json`, `npm run dev`, porta 3001) e conferir:
1. Com `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` ausente, `/checkout` mostra o aviso de provedor indisponível — não um cartão vazio.
2. Com a chave presente e carrinho em BRL, aparece o botão do Mercado Pago sem aviso de conversão.
3. Com a chave presente e carrinho em EUR, aparece o aviso com o valor em reais e o botão só habilita depois da cotação.
4. Console sem erros.

- [ ] **Step 6: Commit**

```bash
git add components/checkout/mercadopago-button.tsx "app/[locale]/checkout/page.tsx" messages/
git commit -m "feat(checkout): Mercado Pago como único provedor visível, com aviso de cobrança em BRL"
```

---

## Depois do código: o que só o Werner pode fazer

1. **Criar a aplicação no painel do Mercado Pago** e copiar `MERCADOPAGO_ACCESS_TOKEN` e `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` para o `.env` local e para as variáveis da Vercel.
2. **Publicar** (merge para `main` dispara o deploy).
3. **Cadastrar a URL de notificação** no painel: `https://<domínio>/api/checkout/mercadopago/webhook`. O painel gera a chave secreta nesse momento — ela vira `MERCADOPAGO_WEBHOOK_SECRET` na Vercel. **Antes desse passo o webhook rejeita tudo com 401, por desenho.**
4. **Cadastrar os preços em BRL** das listas que o `npm run check:precos` apontou.
5. **Testar em sandbox** com as contas de teste do Mercado Pago antes de aceitar dinheiro real: um pagamento por cartão aprovado e um Pix, este último fechando a aba antes de voltar, para exercitar o webhook.
