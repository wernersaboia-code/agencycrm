// app/api/checkout/create-order/route.ts
import { NextRequest, NextResponse } from "next/server"
import { paypalClient } from "@/lib/paypal"
import paypal from "@paypal/checkout-server-sdk"
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const { items } = body // [ { listId, quantity } ]

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "No items" }, { status: 400 })
        }

        // Buscar listas
        const listIds = items.map((item: any) => item.listId)
        const lists = await prisma.leadList.findMany({
            where: { id: { in: listIds }, isActive: true },
        })

        if (lists.length !== items.length) {
            return NextResponse.json({ error: "Invalid items" }, { status: 400 })
        }

        // Calcular total
        let subtotal = 0
        const purchaseItems = lists.map((list) => {
            const quantity = items.find((i: any) => i.listId === list.id)?.quantity || 1
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
                userId: session.user.id,
                paypalOrderId: order.result.id,
                status: "pending",
                subtotal,
                total: subtotal,
                currency,
                buyerEmail: session.user.email,
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