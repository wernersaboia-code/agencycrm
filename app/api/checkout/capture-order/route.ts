// app/api/checkout/capture-order/route.ts
import { NextRequest, NextResponse } from "next/server"
import { paypalClient } from "@/lib/paypal"
import paypal from "@paypal/checkout-server-sdk"
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generatePurchaseAccessToken, generateMagicLinkUrl } from "@/lib/auth/magic-link"
import { sendPurchaseConfirmationEmail } from "@/lib/email/purchase"

export async function POST(request: NextRequest) {
    let orderId: string | undefined
    let sessionUserId: string | undefined

    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll() {},
                },
            }
        )

        const {
            data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        sessionUserId = session.user.id

        const body = await request.json()
        orderId = body.orderId

        if (!orderId) {
            return NextResponse.json({ error: "No order ID" }, { status: 400 })
        }

        const pendingPurchase = await prisma.purchase.findFirst({
            where: {
                paypalOrderId: orderId,
                userId: session.user.id,
                status: "pending",
            },
            select: { id: true },
        })

        if (!pendingPurchase) {
            return NextResponse.json(
                { error: "Purchase not found" },
                { status: 404 }
            )
        }

        // Capturar pagamento no PayPal
        const requestCapture = new paypal.orders.OrdersCaptureRequest(orderId)
        requestCapture.requestBody({})

        const capture = await paypalClient().execute(requestCapture)

        if (capture.result.status !== "COMPLETED") {
            return NextResponse.json(
                { error: "Payment not completed" },
                { status: 400 }
            )
        }

        // Atualizar Purchase no DB
        const purchase = await prisma.purchase.update({
            where: { id: pendingPurchase.id },
            data: {
                status: "paid",
                paidAt: new Date(),
                paypalPayerId: capture.result.payer?.payer_id,
                buyerEmail: capture.result.payer?.email_address,
                buyerName: capture.result.payer?.name?.given_name
                    ? `${capture.result.payer.name.given_name} ${capture.result.payer.name.surname || ""}`.trim()
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
            session.user.id,
            purchase.id, // Token específico para esta compra
            24 // 24 horas de validade
        )

        // 🆕 Gerar URL de acesso
        const accessUrl = generateMagicLinkUrl(accessToken)

        // 🆕 Enviar email de confirmação (assíncrono - não bloqueia a resposta)
        sendPurchaseConfirmationEmail({
            userId: session.user.id,
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
    } catch (error: any) {
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
            { error: error.message || "Failed to capture payment" },
            { status: 500 }
        )
    }
}
