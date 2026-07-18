// app/api/checkout/create-order/route.ts
import { NextRequest, NextResponse } from "next/server"
import { paypalOrders } from "@/lib/paypal"
import {
    CheckoutPaymentIntent,
    OrderApplicationContextLandingPage,
    OrderApplicationContextUserAction,
} from "@paypal/paypal-server-sdk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getPublicAppUrl } from "@/lib/env"
import { getClientIp, checkPersistentRateLimit } from "@/lib/rate-limit"

const createOrderSchema = z.object({
    items: z.array(z.object({
        listId: z.string().min(1),
        quantity: z.number().int().positive().max(99).default(1),
    })).min(1).max(50),
})

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Rate limit persistido (compartilhado entre instâncias serverless):
        // no máximo 10 pedidos por usuário por minuto.
        const allowed = await checkPersistentRateLimit(
            "checkout:create",
            user.id || getClientIp(request),
            10,
            60_000
        )
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 })
        }

        // Backstop persistido (cobre múltiplas instâncias serverless, onde o
        // rate limit em memória não é compartilhado): no máximo 15 pedidos
        // pendentes por usuário na última hora.
        const PENDING_BACKSTOP_MAX = 15
        const PENDING_BACKSTOP_WINDOW_MS = 60 * 60 * 1000
        const recentPending = await prisma.purchase.count({
            where: {
                userId: user.id,
                status: "pending",
                createdAt: { gt: new Date(Date.now() - PENDING_BACKSTOP_WINDOW_MS) },
            },
        })
        if (recentPending >= PENDING_BACKSTOP_MAX) {
            return NextResponse.json({ error: "Too many pending orders" }, { status: 429 })
        }

        const parsedBody = createOrderSchema.safeParse(await request.json())

        if (!parsedBody.success) {
            return NextResponse.json({ error: "Invalid checkout items" }, { status: 400 })
        }

        const { items } = parsedBody.data

        // Buscar listas
        const listIds = items.map((item) => item.listId)
        const lists = await prisma.leadList.findMany({
            where: { id: { in: listIds }, isActive: true },
        })

        if (lists.length !== items.length) {
            return NextResponse.json({ error: "Invalid items" }, { status: 400 })
        }

        const currencies = new Set(lists.map((list) => list.currency))
        if (currencies.size !== 1) {
            return NextResponse.json({ error: "Mixed currencies are not supported" }, { status: 400 })
        }

        // Calcular total
        let subtotal = 0
        const purchaseItems = lists.map((list) => {
            const quantity = items.find((item) => item.listId === list.id)?.quantity ?? 1
            const itemTotal = Number(list.price) * quantity
            subtotal += itemTotal

            return {
                listId: list.id,
                name: list.name,
                price: Number(list.price),
                quantity,
                leadsCount: list.totalLeads,
            }
        })

        const currency = lists[0].currency
        const total = subtotal.toFixed(2)
        const appUrl = getPublicAppUrl()

        const order = await paypalOrders().createOrder({
            prefer: "return=representation",
            body: {
                intent: CheckoutPaymentIntent.Capture,
                purchaseUnits: [
                {
                    amount: {
                        currencyCode: currency,
                        value: total,
                        breakdown: {
                            itemTotal: {
                                currencyCode: currency,
                                value: total,
                            },
                        },
                    },
                    items: purchaseItems.map((item) => ({
                        name: item.name,
                        description: `${item.leadsCount.toLocaleString()} leads`,
                        unitAmount: {
                            currencyCode: currency,
                            value: item.price.toFixed(2),
                        },
                        quantity: item.quantity.toString(),
                    })),
                },
            ],
                applicationContext: {
                    brandName: "Easy Prospect",
                    landingPage: OrderApplicationContextLandingPage.NoPreference,
                    userAction: OrderApplicationContextUserAction.PayNow,
                    returnUrl: `${appUrl}/checkout/success`,
                    cancelUrl: `${appUrl}/checkout/cancel`,
                },
            },
        })

        // Criar registro de Purchase no DB (status: pending)
        const purchase = await prisma.purchase.create({
            data: {
                userId: user.id,
                paypalOrderId: order.result.id,
                status: "pending",
                subtotal,
                total: subtotal,
                currency,
                buyerEmail: user.email,
                items: {
                    create: purchaseItems.map((item) => ({
                        listId: item.listId,
                        price: item.price,
                        currency,
                        leadsCount: item.leadsCount,
                    })),
                },
            },
        })

        return NextResponse.json({
            orderId: order.result.id,
            purchaseId: purchase.id,
        })
    } catch (error) {
        console.error("Error creating order:", error)
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        )
    }
}
