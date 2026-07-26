// app/api/checkout/stripe/confirm-session/route.ts
//
// Chamada pela página de retorno logo depois de o comprador pagar no Stripe.
// Espelha /api/checkout/capture-order (PayPal): valida ownership, confirma o
// pagamento no provedor e efetiva a compra pela função compartilhada —
// idempotente com o webhook checkout.session.completed.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fulfillPurchase, type CapturedAmount } from "@/lib/checkout/fulfillment"
import { z } from "zod"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getClientIp, checkPersistentRateLimit } from "@/lib/rate-limit"
import { getStripe, fromStripeAmount } from "@/lib/stripe"
import type Stripe from "stripe"

const confirmSessionSchema = z.object({
    sessionId: z.string().min(1),
})

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

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Rate limit persistido: no máximo 10 confirmações por usuário por
        // minuto (bucket próprio, separado da captura PayPal).
        const allowed = await checkPersistentRateLimit(
            "checkout:confirm",
            user.id || getClientIp(request),
            10,
            60_000
        )
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 })
        }

        const parsedBody = confirmSessionSchema.safeParse(await request.json())

        if (!parsedBody.success) {
            return NextResponse.json({ error: "No session ID" }, { status: 400 })
        }

        const sessionId = parsedBody.data.sessionId

        // Verifica que a compra pertence a este usuário (autorização — impede
        // confirmar sessão de outra pessoa). Sem filtro de status: o webhook
        // checkout.session.completed costuma chegar ANTES de o comprador ser
        // redirecionado de volta, e exigir "pending" aqui transformava essa
        // vitória do webhook num 404 falso na tela de retorno.
        const purchase = await prisma.purchase.findFirst({
            where: {
                stripeSessionId: sessionId,
                userId: user.id,
            },
            select: { id: true, status: true },
        })

        if (!purchase) {
            return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
        }

        // Já paga (webhook venceu a corrida): o resultado para o comprador é
        // o mesmo sucesso, sem consultar o Stripe de novo.
        if (purchase.status === "paid") {
            return NextResponse.json({ success: true, purchaseId: purchase.id })
        }

        const session = await getStripe().checkout.sessions.retrieve(sessionId)

        if (session.payment_status !== "paid") {
            // Pagamento não confirmado. NÃO marcamos como failed aqui — sessão
            // expirada/falha real é comunicada pelo webhook.
            return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
        }

        // A partir daqui o dinheiro foi capturado. Toda efetivação passa pela
        // função compartilhada, idempotente com o webhook. Importante: nunca
        // marcamos como "failed" depois de um pagamento confirmado — se algo
        // falhar aqui, a compra fica pending e o webhook reconcilia para paid.
        const outcome = await fulfillPurchase(prisma, {
            provider: "stripe",
            providerOrderId: sessionId,
            capturedAmount: getCapturedAmount(session),
            payer: {
                email: session.customer_details?.email ?? session.customer_email ?? null,
                name: session.customer_details?.name ?? null,
            },
            providerPaymentId: getPaymentIntentId(session),
        })

        switch (outcome.status) {
            case "fulfilled":
                return NextResponse.json({
                    success: true,
                    purchaseId: outcome.purchaseId,
                    accessUrl: outcome.accessUrl,
                })
            case "already_fulfilled":
                return NextResponse.json({
                    success: true,
                    purchaseId: outcome.purchaseId,
                })
            case "amount_mismatch":
                return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 })
            case "not_found":
                return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
        }
    } catch (error: unknown) {
        console.error("Error confirming Stripe session:", error)
        return NextResponse.json({ error: "Failed to confirm session" }, { status: 500 })
    }
}
