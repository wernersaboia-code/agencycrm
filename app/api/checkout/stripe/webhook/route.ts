// app/api/checkout/stripe/webhook/route.ts
//
// Recebe eventos de webhook do Stripe. Serve como rede de reconciliação:
// se o comprador fechar o navegador antes de a página de retorno chamar
// confirm-session, o evento checkout.session.completed efetiva a compra.
//
// A verificação de assinatura é obrigatória e fail-closed: sem
// STRIPE_WEBHOOK_SECRET ou com assinatura inválida, o evento é rejeitado.
// O corpo precisa ser lido CRU (request.text()) — qualquer parse anterior
// invalida a assinatura.

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fulfillPurchase, type CapturedAmount } from "@/lib/checkout/fulfillment"
import { getStripe, fromStripeAmount } from "@/lib/stripe"
import { getStripeWebhookSecret } from "@/lib/server-env"
import type Stripe from "stripe"

export const dynamic = "force-dynamic"

function getCapturedAmount(session: Stripe.Checkout.Session): CapturedAmount | null {
    if (session.amount_total == null || !session.currency) {
        return null
    }

    return {
        value: fromStripeAmount(session.amount_total),
        currency: session.currency.toUpperCase(),
    }
}

function getPaymentIntentId(session: Stripe.Checkout.Session): string | null {
    if (!session.payment_intent) {
        return null
    }

    return typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id
}

export async function POST(request: Request) {
    const rawBody = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }

    let webhookSecret: string
    try {
        webhookSecret = getStripeWebhookSecret()
    } catch {
        console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET não configurado — evento rejeitado")
        return NextResponse.json({ error: "Webhook not configured" }, { status: 401 })
    }

    let event: Stripe.Event
    try {
        event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (error) {
        console.error("[Stripe Webhook] Assinatura inválida:", error)
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object

                // Métodos de pagamento assíncronos (ex.: boleto) completam a
                // sessão antes de o dinheiro existir. Só efetivamos com o
                // pagamento confirmado; os demais estados ficam para eventos
                // futuros. Cartão (o método habilitado) chega sempre paid.
                if (session.payment_status !== "paid") {
                    console.log(
                        `[Stripe Webhook] session.completed sem pagamento confirmado (${session.payment_status}) session=${session.id}`
                    )
                    break
                }

                const outcome = await fulfillPurchase(prisma, {
                    provider: "stripe",
                    providerOrderId: session.id,
                    capturedAmount: getCapturedAmount(session),
                    payer: {
                        email: session.customer_details?.email ?? session.customer_email ?? null,
                        name: session.customer_details?.name ?? null,
                    },
                    providerPaymentId: getPaymentIntentId(session),
                })

                console.log(
                    `[Stripe Webhook] checkout.session.completed session=${session.id} outcome=${outcome.status}`
                )
                break
            }

            case "checkout.session.expired": {
                const session = event.data.object

                // Só falha compras ainda pendentes — nunca uma já paga.
                await prisma.purchase.updateMany({
                    where: { stripeSessionId: session.id, status: "pending" },
                    data: { status: "failed" },
                })
                console.log(`[Stripe Webhook] checkout.session.expired session=${session.id}`)
                break
            }

            default:
                // Eventos não tratados são ignorados (mas confirmados com 200).
                break
        }
    } catch (error) {
        console.error("[Stripe Webhook] Erro ao processar evento:", error)
        // 500 faz o Stripe reentregar o evento mais tarde.
        return NextResponse.json({ error: "Processing error" }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}
