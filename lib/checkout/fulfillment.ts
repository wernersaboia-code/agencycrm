// lib/checkout/fulfillment.ts
//
// Lógica compartilhada de "fulfillment" de uma compra do PayPal.
// É chamada por dois caminhos que podem correr em paralelo:
//   1. /api/checkout/capture-order  (frontend, logo após o pagamento)
//   2. /api/checkout/webhook        (PayPal, evento PAYMENT.CAPTURE.COMPLETED)
//
// A transição pending -> paid é feita com um updateMany condicional, de modo
// que apenas UM dos caminhos efetive a compra e dispare o e-mail de
// confirmação, mesmo que ambos cheguem ao mesmo tempo (idempotência).

import { prisma } from "@/lib/prisma"
import { generatePurchaseAccessToken, generateMagicLinkUrl } from "@/lib/auth/magic-link"
import { sendPurchaseConfirmationEmail } from "@/lib/email/purchase"

export type CapturedAmount = { value: string; currency: string }

export type PayerInfo = {
    payerId?: string | null
    email?: string | null
    name?: string | null
}

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
 * Efetiva uma compra a partir do orderId do PayPal, de forma idempotente.
 *
 * - Se a compra não existe: `not_found`.
 * - Se já está paga (ou em estado terminal): `already_fulfilled` (no-op).
 * - Se o valor capturado não bate com o total: `amount_mismatch` (NÃO marca paga).
 * - Se efetivou agora: `fulfilled` e dispara o e-mail de confirmação.
 * - Se outro processo efetivou no meio da corrida: `already_fulfilled` sem
 *   reenviar e-mail.
 */
export async function fulfillPurchaseByOrderId(params: {
    paypalOrderId: string
    capturedAmount: CapturedAmount | null
    payer?: PayerInfo
}): Promise<FulfillOutcome> {
    const { paypalOrderId, capturedAmount, payer } = params

    const purchase = await prisma.purchase.findUnique({
        where: { paypalOrderId },
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
    const updated = await prisma.purchase.updateMany({
        where: { id: purchase.id, status: "pending" },
        data: {
            status: "paid",
            paidAt: new Date(),
            ...(payer?.payerId ? { paypalPayerId: payer.payerId } : {}),
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

    // Assíncrono — não bloqueia a resposta ao PayPal/cliente.
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
