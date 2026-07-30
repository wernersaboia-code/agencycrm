// app/api/checkout/stripe/create-session/route.ts
//
// Cria uma Checkout Session no Stripe e o registro de Purchase pendente.
// Espelha /api/checkout/create-order (PayPal): mesma autenticação, mesmo
// rate limit, mesmo backstop de pedidos pendentes e mesma validação de itens.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getPublicAppUrl } from "@/lib/env"
import { getClientIp, checkPersistentRateLimit } from "@/lib/rate-limit"
import { getStripe, isStripeConfigured, toStripeAmount } from "@/lib/stripe"
import { SUPPORTED_CURRENCIES } from "@/lib/currency"
import { resolveListPrices } from "@/lib/marketplace/list-prices"

const createSessionSchema = z.object({
    items: z.array(z.object({
        listId: z.string().min(1),
        quantity: z.number().int().positive().max(99).default(1),
    })).min(1).max(50),
    // O cliente envia o CÓDIGO da moeda, nunca um valor. O preço sai do banco.
    currency: z.enum(SUPPORTED_CURRENCIES),
})

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!isStripeConfigured()) {
            return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
        }

        // Rate limit persistido (compartilhado entre instâncias serverless):
        // no máximo 10 pedidos por usuário por minuto — mesmo bucket do PayPal,
        // para os dois provedores dividirem o mesmo teto.
        const allowed = await checkPersistentRateLimit(
            "checkout:create",
            user.id || getClientIp(request),
            10,
            60_000
        )
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 })
        }

        // Backstop persistido, idêntico ao do PayPal: no máximo 15 pedidos
        // pendentes por usuário na última hora, somando os dois provedores.
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

        const parsedBody = createSessionSchema.safeParse(await request.json())

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

        // A moeda vem do corpo e vale para o pedido inteiro (mesma regra do
        // PayPal): não existe mais moeda por lista para conferir.
        const currency = parsedBody.data.currency
        const prices = await resolveListPrices(prisma, listIds, currency)

        // No checkout, item sem preço na moeda escolhida é erro 400 — a queda
        // para euro é comportamento de vitrine, e cobrar numa moeda diferente
        // da exibida é cobrar diferente do combinado.
        const semPreco = lists.filter((list) => prices.get(list.id)?.currency !== currency)
        if (semPreco.length > 0) {
            return NextResponse.json(
                { error: "Item without price in the selected currency" },
                { status: 400 }
            )
        }

        // Calcular total (mesma regra do PayPal)
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

        const appUrl = getPublicAppUrl()

        const session = await getStripe().checkout.sessions.create({
            mode: "payment",
            line_items: purchaseItems.map((item) => ({
                quantity: item.quantity,
                price_data: {
                    // Stripe quer a moeda em minúsculas e o valor em centavos.
                    currency: currency.toLowerCase(),
                    unit_amount: toStripeAmount(item.price),
                    product_data: {
                        name: item.name,
                        description: `${item.leadsCount.toLocaleString()} leads`,
                    },
                },
            })),
            customer_email: user.email,
            success_url: `${appUrl}/checkout/stripe-return?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/checkout/cancel`,
        })

        if (!session.url) {
            console.error("[Stripe] Session criada sem URL de checkout:", session.id)
            return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
        }

        // Criar registro de Purchase no DB (status: pending). A compra precisa
        // existir ANTES de o comprador ser redirecionado — o webhook e o
        // confirm-session localizam por stripeSessionId.
        const purchase = await prisma.purchase.create({
            data: {
                userId: user.id,
                provider: "stripe",
                stripeSessionId: session.id,
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
            url: session.url,
            purchaseId: purchase.id,
        })
    } catch (error) {
        console.error("Error creating Stripe session:", error)
        return NextResponse.json(
            { error: "Failed to create session" },
            { status: 500 }
        )
    }
}
