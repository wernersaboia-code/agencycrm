// app/api/checkout/capture-order/route.ts
import { NextRequest, NextResponse } from "next/server"
import { paypalOrders } from "@/lib/paypal"
import { OrderStatus } from "@paypal/paypal-server-sdk"
import { prisma } from "@/lib/prisma"
import { generatePurchaseAccessToken, generateMagicLinkUrl } from "@/lib/auth/magic-link"
import { sendPurchaseConfirmationEmail } from "@/lib/email/purchase"
import { z } from "zod"
import { getAuthenticatedDbUser } from "@/lib/auth"

const captureOrderSchema = z.object({
    orderId: z.string().min(1),
})

type PayPalCaptureResult = {
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

function getCapturedAmount(captureResult: unknown): { value: string; currency: string } | null {
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

export async function POST(request: NextRequest) {
    let orderId: string | undefined
    let sessionUserId: string | undefined

    try {
        const user = await getAuthenticatedDbUser()

        if (!user || user.status !== "ACTIVE") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        sessionUserId = user.id

        const parsedBody = captureOrderSchema.safeParse(await request.json())

        if (!parsedBody.success) {
            return NextResponse.json({ error: "No order ID" }, { status: 400 })
        }

        orderId = parsedBody.data.orderId

        const pendingPurchase = await prisma.purchase.findFirst({
            where: {
                paypalOrderId: orderId,
                userId: user.id,
                status: "pending",
            },
            select: {
                id: true,
                total: true,
                currency: true,
            },
        })

        if (!pendingPurchase) {
            return NextResponse.json(
                { error: "Purchase not found" },
                { status: 404 }
            )
        }

        const capture = await paypalOrders().captureOrder({
            id: orderId,
            prefer: "return=representation",
            body: {},
        })

        if (capture.result.status !== OrderStatus.Completed) {
            return NextResponse.json(
                { error: "Payment not completed" },
                { status: 400 }
            )
        }

        const capturedAmount = getCapturedAmount(capture.result)
        const expectedTotal = Number(pendingPurchase.total).toFixed(2)

        if (
            !capturedAmount ||
            capturedAmount.value !== expectedTotal ||
            capturedAmount.currency !== pendingPurchase.currency
        ) {
            return NextResponse.json(
                { error: "Payment amount mismatch" },
                { status: 400 }
            )
        }

        // Atualizar Purchase no DB
        const purchase = await prisma.purchase.update({
            where: { id: pendingPurchase.id },
            data: {
                status: "paid",
                paidAt: new Date(),
                paypalPayerId: capture.result.payer?.payerId,
                buyerEmail: capture.result.payer?.emailAddress,
                buyerName: capture.result.payer?.name?.givenName
                    ? `${capture.result.payer.name.givenName} ${capture.result.payer.name.surname || ""}`.trim()
                    : null,
            },
            include: {
                items: {
                    include: {
                        list: true,
                    },
                },
            },
        })

        // 🆕 Gerar token mágico para acesso às compras
        const accessToken = await generatePurchaseAccessToken(
            user.id,
            purchase.id, // Token específico para esta compra
            24 // 24 horas de validade
        )

        // 🆕 Gerar URL de acesso
        const accessUrl = generateMagicLinkUrl(accessToken)

        // 🆕 Enviar email de confirmação (assíncrono - não bloqueia a resposta)
        sendPurchaseConfirmationEmail({
            userId: user.id,
            purchaseId: purchase.id,
            accessToken,
            accessUrl,
        }).catch(error => {
            console.error("Erro ao enviar email de confirmação:", error)
        })

        return NextResponse.json({
            success: true,
            purchaseId: purchase.id,
            accessUrl, // Retornar URL para possível uso no frontend
        })
    } catch (error: unknown) {
        console.error("Error capturing order:", error)

        // Atualizar status para failed se houver erro
        if (orderId) {
            await prisma.purchase.updateMany({
                where: {
                    paypalOrderId: orderId,
                    userId: sessionUserId,
                    status: "pending",
                },
                data: { status: "failed" },
            })
        }

        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        )
    }
}
