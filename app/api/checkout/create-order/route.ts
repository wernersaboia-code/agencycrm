// app/api/checkout/create-order/route.ts
import { NextRequest, NextResponse } from "next/server"
import { paypalClient } from "@/lib/paypal"
import paypal from "@paypal/checkout-server-sdk"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getAuthenticatedDbUser } from "@/lib/auth"

const createOrderSchema = z.object({
    items: z.array(z.object({
        listId: z.string().min(1),
        quantity: z.number().int().positive().max(99).default(1),
    })).min(1).max(50),
})

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedDbUser()

        if (!user || user.status !== "ACTIVE") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

        // Criar ordem no PayPal
        const requestOrder = new paypal.orders.OrdersCreateRequest()
        requestOrder.prefer("return=representation")
        requestOrder.requestBody({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: currency,
                        value: total,
                        breakdown: {
                            item_total: {
                                currency_code: currency,
                                value: total,
                            },
                        },
                    },
                    items: purchaseItems.map((item) => ({
                        name: item.name,
                        description: `${item.leadsCount.toLocaleString()} leads`,
                        unit_amount: {
                            currency_code: currency,
                            value: item.price.toFixed(2),
                        },
                        quantity: item.quantity.toString(),
                    })),
                },
            ],
            application_context: {
                brand_name: "LeadStore",
                landing_page: "NO_PREFERENCE",
                user_action: "PAY_NOW",
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
            },
        })

        const order = await paypalClient().execute(requestOrder)

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
