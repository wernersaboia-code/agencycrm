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
    MercadoPagoApiError,
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
    const dataId = request.nextUrl.searchParams.get("data.id") ?? String(body?.data?.id ?? "")

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
        // Pagamento que a API não encontra é falha PERMANENTE: pedir reentrega
        // só repete o mesmo 404 por horas, e o ruído encobre falha de verdade.
        // Acontece com o simulador do painel (id fictício) e com notificação
        // dirigida a outra conta.
        if (error instanceof MercadoPagoApiError && error.status === 404) {
            console.warn(
                `[Mercado Pago Webhook] Pagamento ${dataId} não existe nesta conta — evento descartado`
            )
            return NextResponse.json({ received: true })
        }

        console.error("[Mercado Pago Webhook] Erro ao processar evento:", error)
        // 500 faz o Mercado Pago reentregar mais tarde.
        return NextResponse.json({ error: "Processing error" }, { status: 500 })
    }
}
