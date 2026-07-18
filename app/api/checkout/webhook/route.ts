// app/api/checkout/webhook/route.ts
//
// Recebe eventos de webhook do PayPal. Serve como rede de reconciliação:
// se o cliente fechar o navegador antes de o frontend chamar capture-order,
// o evento PAYMENT.CAPTURE.COMPLETED efetiva a compra mesmo assim.
//
// A verificação de assinatura é obrigatória e fail-closed: sem
// PAYPAL_WEBHOOK_ID ou com assinatura inválida, o evento é rejeitado.

import { NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/paypal"
import { fulfillPurchaseByOrderId } from "@/lib/checkout/fulfillment"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Cabeçalhos usados na verificação de assinatura do PayPal.
const SIGNATURE_HEADERS = [
    "paypal-transmission-id",
    "paypal-transmission-time",
    "paypal-transmission-sig",
    "paypal-cert-url",
    "paypal-auth-algo",
] as const

type PayPalWebhookEvent = {
    event_type?: string
    resource?: {
        amount?: { value?: string; currency_code?: string }
        supplementary_data?: { related_ids?: { order_id?: string } }
    }
}

function getOrderId(event: PayPalWebhookEvent): string | null {
    return event.resource?.supplementary_data?.related_ids?.order_id ?? null
}

export async function POST(request: Request) {
    const rawBody = await request.text()

    const headers: Record<string, string> = {}
    for (const name of SIGNATURE_HEADERS) {
        const value = request.headers.get(name)
        if (value) {
            headers[name] = value
        }
    }

    let event: PayPalWebhookEvent
    try {
        event = JSON.parse(rawBody)
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const isValid = await verifyWebhookSignature(headers, event)
    if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    try {
        switch (event.event_type) {
            case "PAYMENT.CAPTURE.COMPLETED": {
                const orderId = getOrderId(event)
                if (!orderId) {
                    console.warn("[PayPal Webhook] CAPTURE.COMPLETED sem order_id")
                    break
                }

                const amount = event.resource?.amount
                const capturedAmount =
                    amount?.value && amount.currency_code
                        ? { value: amount.value, currency: amount.currency_code }
                        : null

                const outcome = await fulfillPurchaseByOrderId({
                    paypalOrderId: orderId,
                    capturedAmount,
                })

                console.log(
                    `[PayPal Webhook] CAPTURE.COMPLETED order=${orderId} outcome=${outcome.status}`
                )
                break
            }

            case "PAYMENT.CAPTURE.DENIED":
            case "PAYMENT.CAPTURE.DECLINED": {
                const orderId = getOrderId(event)
                if (orderId) {
                    // Só falha compras ainda pendentes — nunca uma já paga.
                    await prisma.purchase.updateMany({
                        where: { paypalOrderId: orderId, status: "pending" },
                        data: { status: "failed" },
                    })
                    console.log(`[PayPal Webhook] ${event.event_type} order=${orderId}`)
                }
                break
            }

            default:
                // Eventos não tratados são ignorados (mas confirmados com 200).
                break
        }
    } catch (error) {
        console.error("[PayPal Webhook] Erro ao processar evento:", error)
        // 500 faz o PayPal reentregar o evento mais tarde.
        return NextResponse.json({ error: "Processing error" }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}
