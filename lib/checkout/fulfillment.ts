// lib/checkout/fulfillment.ts
//
// Lógica compartilhada de "fulfillment" de uma compra do marketplace, válida
// para os dois provedores de pagamento (PayPal e Stripe).
// É chamada por caminhos que podem correr em paralelo:
//   1. /api/checkout/capture-order            (PayPal, frontend após o pagamento)
//   2. /api/checkout/webhook                  (PayPal, PAYMENT.CAPTURE.COMPLETED)
//   3. /api/checkout/stripe/confirm-session   (Stripe, frontend ao voltar)
//   4. /api/checkout/stripe/webhook           (Stripe, checkout.session.completed)
//
// A transição pending -> paid é feita com um updateMany condicional, de modo
// que apenas UM dos caminhos efetive a compra e dispare o e-mail de
// confirmação, mesmo que ambos cheguem ao mesmo tempo (idempotência).

import { prisma } from "@/lib/prisma"
import type { PrismaClient } from "@prisma/client"
import { generatePurchaseAccessToken, generateMagicLinkUrl } from "@/lib/auth/magic-link"
import { sendPurchaseConfirmationEmail } from "@/lib/email/purchase"

export type CapturedAmount = { value: string; currency: string }

export type PayerInfo = {
    payerId?: string | null
    email?: string | null
    name?: string | null
}

export type PaymentProviderInput = "paypal" | "stripe" | "mercadopago"

export type FulfillOutcome =
    | { status: "fulfilled"; purchaseId: string; accessUrl: string }
    | { status: "already_fulfilled"; purchaseId: string }
    | { status: "not_found" }
    | { status: "amount_mismatch"; purchaseId: string }

/**
 * Compara o valor capturado no PayPal com o total esperado da compra.
 * Função pura — não toca no banco — para facilitar teste.
 */
export function amountMatches(
    captured: CapturedAmount | null,
    expected: { total: number | string; currency: string }
): boolean {
    if (!captured) {
        return false
    }
    const expectedValue = Number(expected.total).toFixed(2)
    return captured.value === expectedValue && captured.currency === expected.currency
}

/**
 * Efetiva uma compra de forma idempotente, a partir do identificador do
 * provedor de pagamento (order do PayPal ou session do Stripe).
 *
 * - Se a compra não existe: `not_found`.
 * - Se já está paga (ou em estado terminal): `already_fulfilled` (no-op).
 * - Se o valor capturado não bate com o total: `amount_mismatch` (NÃO marca paga).
 * - Se efetivou agora: `fulfilled` e dispara o e-mail de confirmação.
 * - Se outro processo efetivou no meio da corrida: `already_fulfilled` sem
 *   reenviar e-mail.
 *
 * O `db` vem por parâmetro (padrão dos helpers de domínio) para a função ser
 * testável sem banco real.
 */

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

export async function fulfillPurchase(
    db: PrismaClient,
    params: {
        provider: PaymentProviderInput
        /** paypalOrderId (PayPal) ou stripeSessionId (Stripe). */
        providerOrderId: string
        capturedAmount: CapturedAmount | null
        payer?: PayerInfo
        /** paymentIntentId (Stripe) — gravado na efetivação. */
        providerPaymentId?: string | null
    }
): Promise<FulfillOutcome> {
    const { provider, providerOrderId, capturedAmount, payer, providerPaymentId } = params

    const purchase = await db.purchase.findUnique({
        where: BUSCA_POR_PROVEDOR[provider](providerOrderId),
        select: {
            id: true,
            userId: true,
            status: true,
            total: true,
            currency: true,
        },
    })

    if (!purchase) {
        return { status: "not_found" }
    }

    // Qualquer estado não-pending é terminal para este fluxo (paid/failed/refunded).
    if (purchase.status !== "pending") {
        return { status: "already_fulfilled", purchaseId: purchase.id }
    }

    if (!amountMatches(capturedAmount, { total: purchase.total.toString(), currency: purchase.currency })) {
        return { status: "amount_mismatch", purchaseId: purchase.id }
    }

    // Transição condicional: só efetiva quem encontrar o registro ainda pending.
    const updated = await db.purchase.updateMany({
        where: { id: purchase.id, status: "pending" },
        data: {
            status: "paid",
            paidAt: new Date(),
            ...(provider === "paypal" && payer?.payerId
                ? { paypalPayerId: payer.payerId }
                : {}),
            ...(provider === "stripe" && providerPaymentId
                ? { stripePaymentIntentId: providerPaymentId }
                : {}),
            ...(provider === "mercadopago" && providerPaymentId
                ? { mercadoPagoPaymentId: providerPaymentId }
                : {}),
            ...(payer?.email ? { buyerEmail: payer.email } : {}),
            ...(payer?.name ? { buyerName: payer.name } : {}),
        },
    })

    if (updated.count === 0) {
        // Corrida perdida: o outro caminho já efetivou. Não reenvia e-mail.
        return { status: "already_fulfilled", purchaseId: purchase.id }
    }

    const accessToken = await generatePurchaseAccessToken(purchase.userId, purchase.id, 24)
    const accessUrl = generateMagicLinkUrl(accessToken)

    // Assíncrono — não bloqueia a resposta ao provedor/cliente.
    sendPurchaseConfirmationEmail({
        userId: purchase.userId,
        purchaseId: purchase.id,
        accessToken,
        accessUrl,
    }).catch((error) => {
        console.error("[Fulfillment] Erro ao enviar e-mail de confirmação:", error)
    })

    return { status: "fulfilled", purchaseId: purchase.id, accessUrl }
}

/**
 * Atalho para o caminho PayPal, mantido para os callers existentes
 * (capture-order e webhook do PayPal). Código novo deve chamar
 * `fulfillPurchase` diretamente com o provider explícito.
 */
export async function fulfillPurchaseByOrderId(params: {
    paypalOrderId: string
    capturedAmount: CapturedAmount | null
    payer?: PayerInfo
}): Promise<FulfillOutcome> {
    return fulfillPurchase(prisma, {
        provider: "paypal",
        providerOrderId: params.paypalOrderId,
        capturedAmount: params.capturedAmount,
        payer: params.payer,
    })
}
