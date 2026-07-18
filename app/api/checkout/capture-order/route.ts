// app/api/checkout/capture-order/route.ts
import { NextRequest, NextResponse } from "next/server"
import { paypalOrders } from "@/lib/paypal"
import { OrderStatus } from "@paypal/paypal-server-sdk"
import { prisma } from "@/lib/prisma"
import { fulfillPurchaseByOrderId, type CapturedAmount, type PayerInfo } from "@/lib/checkout/fulfillment"
import { z } from "zod"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getClientIp } from "@/lib/rate-limit"
import { checkPersistentRateLimit } from "@/lib/rate-limit"

const captureOrderSchema = z.object({
    orderId: z.string().min(1),
})

type PayPalCaptureResult = {
    payer?: {
        payerId?: string
        emailAddress?: string
        name?: { givenName?: string; surname?: string }
    }
    purchaseUnits?: {
        payments?: {
            captures?: {
                amount?: {
                    value?: string
                    currencyCode?: string
                }
            }[]
        }
    }[]
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Failed to capture payment"
}

function getCapturedAmount(captureResult: unknown): CapturedAmount | null {
    const result = captureResult as PayPalCaptureResult
    const capturedAmount = result.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount

    if (!capturedAmount?.value || !capturedAmount.currencyCode) {
        return null
    }

    return {
        value: capturedAmount.value,
        currency: capturedAmount.currencyCode,
    }
}

function getPayerInfo(captureResult: unknown): PayerInfo {
    const result = captureResult as PayPalCaptureResult
    const payer = result.payer

    return {
        payerId: payer?.payerId ?? null,
        email: payer?.emailAddress ?? null,
        name: payer?.name?.givenName
            ? `${payer.name.givenName} ${payer.name.surname || ""}`.trim()
            : null,
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Rate limit persistido (compartilhado entre instâncias serverless):
        // no máximo 10 tentativas de captura por usuário por minuto.
        const allowed = await checkPersistentRateLimit(
            "checkout:capture",
            user.id || getClientIp(request),
            10,
            60_000
        )
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 })
        }

        const parsedBody = captureOrderSchema.safeParse(await request.json())

        if (!parsedBody.success) {
            return NextResponse.json({ error: "No order ID" }, { status: 400 })
        }

        const orderId = parsedBody.data.orderId

        // Verifica que o pedido pertence a este usuário e ainda está pendente
        // (autorização — impede captura de pedido de outra pessoa).
        const pendingPurchase = await prisma.purchase.findFirst({
            where: {
                paypalOrderId: orderId,
                userId: user.id,
                status: "pending",
            },
            select: { id: true },
        })

        if (!pendingPurchase) {
            return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
        }

        const capture = await paypalOrders().captureOrder({
            id: orderId,
            prefer: "return=representation",
            body: {},
        })

        if (capture.result.status !== OrderStatus.Completed) {
            // Captura não completou. NÃO marcamos como failed aqui — o webhook
            // PAYMENT.CAPTURE.DENIED é a fonte da verdade para falhas reais.
            return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
        }

        // A partir daqui o dinheiro foi capturado. Toda efetivação passa pela
        // função compartilhada, idempotente com o webhook. Importante: nunca
        // marcamos como "failed" depois de uma captura bem-sucedida — se algo
        // falhar aqui, a compra fica pending e o webhook reconcilia para paid.
        const outcome = await fulfillPurchaseByOrderId({
            paypalOrderId: orderId,
            capturedAmount: getCapturedAmount(capture.result),
            payer: getPayerInfo(capture.result),
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
        console.error("Error capturing order:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
