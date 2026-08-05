// app/api/checkout/paddle/confirm-transaction/route.ts
//
// Caminho rápido, chamado pelo overlay quando ele avisa que concluiu.
//
// Existe por UX: o comprador está olhando a tela, e esperar o webhook seriam
// segundos de nada acontecendo. O webhook continua sendo a autoridade — a
// corrida entre os dois é resolvida pela transição condicional de
// fulfillPurchase, e foi observada em produção no fluxo do Mercado Pago.
//
// O valor NUNCA vem do cliente: só o id da transação chega no corpo, e o
// total é lido da API do Paddle.
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getClientIp, checkPersistentRateLimit } from "@/lib/rate-limit"
import { fulfillPurchase, type CapturedAmount } from "@/lib/checkout/fulfillment"
import { getTransaction, fromPaddleAmount, isPaddleConfigured, PaddleApiError } from "@/lib/paddle"

const bodySchema = z.object({
    transactionId: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!isPaddleConfigured()) {
            return NextResponse.json({ error: "Paddle not configured" }, { status: 503 })
        }

        const allowed = await checkPersistentRateLimit(
            "checkout:confirm",
            user.id || getClientIp(request),
            30,
            60_000
        )
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 })
        }

        const parsedBody = bodySchema.safeParse(await request.json())

        if (!parsedBody.success) {
            return NextResponse.json({ error: "Invalid body" }, { status: 400 })
        }

        let transaction
        try {
            transaction = await getTransaction(parsedBody.data.transactionId)
        } catch (error) {
            if (error instanceof PaddleApiError && error.status === 404) {
                return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
            }
            throw error
        }

        if (transaction.status !== "completed") {
            // Ainda não concluída: o webhook resolve quando concluir.
            return NextResponse.json({ status: "pending" })
        }

        if (!transaction.purchaseId) {
            console.error(`[Paddle] Transação ${transaction.id} sem purchaseId em custom_data`)
            return NextResponse.json({ error: "Transaction not linked" }, { status: 400 })
        }

        const capturedAmount: CapturedAmount | null =
            !transaction.grandTotal || !transaction.currencyCode
                ? null
                : {
                      value: fromPaddleAmount(transaction.grandTotal),
                      currency: transaction.currencyCode.toUpperCase(),
                  }

        const outcome = await fulfillPurchase(prisma, {
            provider: "paddle",
            providerOrderId: transaction.purchaseId,
            capturedAmount,
            payer: { email: transaction.customerEmail },
            providerPaymentId: transaction.id,
        })

        return NextResponse.json({ status: outcome.status, purchaseId: transaction.purchaseId })
    } catch (error) {
        console.error("Error confirming Paddle transaction:", error)
        return NextResponse.json({ error: "Failed to confirm" }, { status: 500 })
    }
}
