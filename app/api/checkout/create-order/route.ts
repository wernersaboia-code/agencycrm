// app/api/checkout/create-order/route.ts
import { NextRequest, NextResponse } from "next/server"
import { paypalOrders } from "@/lib/paypal"
import {
    CheckoutPaymentIntent,
    OrderApplicationContextLandingPage,
    OrderApplicationContextUserAction,
} from "@paypal/paypal-server-sdk"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getPublicAppUrl } from "@/lib/env"
import { getClientIp, checkPersistentRateLimit } from "@/lib/rate-limit"
import { resolveListPrices } from "@/lib/marketplace/list-prices"
// O cliente envia o CÓDIGO da moeda, nunca um valor. O preço sai do banco.
// Schema compartilhado com a rota do Stripe (ver lib/checkout/request-schema).
import { checkoutRequestSchema } from "@/lib/checkout/request-schema"

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

        const parsedBody = checkoutRequestSchema.safeParse(await request.json())

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

        // A moeda é uma só por definição: vem do corpo da requisição e já foi
        // validada contra SUPPORTED_CURRENCIES. A verificação antiga de moedas
        // misturadas existia porque cada lista carregava a sua.
        const currency = parsedBody.data.currency
        const prices = await resolveListPrices(prisma, listIds, currency)

        // Fallback é comportamento de VITRINE. No checkout, exibir euro e
        // cobrar euro depois de a pessoa ter escolhido real seria cobrar
        // diferente do combinado — então aqui é erro, não queda silenciosa.
        const semPreco = lists.filter((list) => prices.get(list.id)?.currency !== currency)
        if (semPreco.length > 0) {
            return NextResponse.json(
                { error: "Item without price in the selected currency" },
                { status: 400 }
            )
        }

        // Calcular total
        let subtotal = 0
        const purchaseItems = lists.map((list) => {
            const quantity = items.find((item) => item.listId === list.id)?.quantity ?? 1
            const unitPrice = prices.get(list.id)!.amount
            subtotal += unitPrice * quantity

            return {
                listId: list.id,
                name: list.name,
                price: unitPrice,
                quantity,
                leadsCount: list.totalLeads,
            }
        })

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
