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
