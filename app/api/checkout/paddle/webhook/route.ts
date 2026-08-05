// app/api/checkout/paddle/webhook/route.ts
//
// Recebe as notificações do Paddle.
//
// O corpo é lido CRU e só depois interpretado: a assinatura cobre os bytes
// exatos que chegaram, e reserializar o JSON — mesmo sem mudar o significado —
// derruba a verificação. Este é o erro clássico da integração.
//
// A verificação é obrigatória e fail-closed.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fulfillPurchase, type CapturedAmount } from "@/lib/checkout/fulfillment"
import { mapPaddleEvent } from "@/lib/checkout/paddle-status"
import { fromPaddleAmount, verifyPaddleSignature } from "@/lib/paddle"
import { getPaddleWebhookSecret } from "@/lib/server-env"

export const dynamic = "force-dynamic"

type WebhookBody = {
    event_type?: string
    data?: {
        id?: string
        currency_code?: string
        custom_data?: { purchaseId?: string }
        details?: { totals?: { grand_total?: string } }
        customer?: { email?: string }
    }
}

export async function POST(request: NextRequest) {
    let secret: string
    try {
        secret = getPaddleWebhookSecret()
    } catch {
        console.warn("[Paddle Webhook] PADDLE_WEBHOOK_SECRET não configurado — evento rejeitado")
        return NextResponse.json({ error: "Webhook not configured" }, { status: 401 })
    }

    // CRU, antes de qualquer parse.
    const rawBody = await request.text()

    const valida = verifyPaddleSignature({
        signatureHeader: request.headers.get("paddle-signature"),
        rawBody,
        secret,
    })

    if (!valida) {
        console.error("[Paddle Webhook] Assinatura inválida")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    let body: WebhookBody
    try {
        body = JSON.parse(rawBody) as WebhookBody
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const eventType = body.event_type ?? ""

    if (mapPaddleEvent(eventType) === "ignore") {
        console.log(`[Paddle Webhook] evento=${eventType} — nenhuma ação`)
        return NextResponse.json({ received: true })
    }

    const purchaseId = body.data?.custom_data?.purchaseId

    if (!purchaseId) {
        console.error(`[Paddle Webhook] transação ${body.data?.id} sem purchaseId em custom_data`)
        return NextResponse.json({ received: true })
    }

    try {
        const grandTotal = body.data?.details?.totals?.grand_total
        const currencyCode = body.data?.currency_code

        const capturedAmount: CapturedAmount | null =
            !grandTotal || !currencyCode
                ? null
                : { value: fromPaddleAmount(grandTotal), currency: currencyCode.toUpperCase() }

        const outcome = await fulfillPurchase(prisma, {
            provider: "paddle",
            providerOrderId: purchaseId,
            capturedAmount,
            payer: { email: body.data?.customer?.email ?? null },
            providerPaymentId: body.data?.id ?? null,
        })

        console.log(
            `[Paddle Webhook] transacao=${body.data?.id} compra=${purchaseId} outcome=${outcome.status}`
        )

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("[Paddle Webhook] Erro ao processar evento:", error)
        // 500 faz o Paddle reentregar mais tarde.
        return NextResponse.json({ error: "Processing error" }, { status: 500 })
    }
}
