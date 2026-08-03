// app/api/checkout/mercadopago/create-preference/route.ts
//
// Cria a Purchase pendente e a preferência do Checkout Pro.
//
// A ordem é INVERTIDA em relação ao Stripe, e de propósito: o webhook do
// Mercado Pago entrega só o ID do pagamento, e quem amarra o pagamento ao
// pedido é o `external_reference` — que é o nosso purchase.id. Ele precisa
// existir antes da preferência.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getPublicAppUrl } from "@/lib/env"
import { getClientIp, checkPersistentRateLimit } from "@/lib/rate-limit"
import { createPreference, isMercadoPagoConfigured } from "@/lib/mercadopago"
import { checkoutRequestSchema } from "@/lib/checkout/request-schema"
import { resolveListPrices } from "@/lib/marketplace/list-prices"

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!isMercadoPagoConfigured()) {
            return NextResponse.json({ error: "Mercado Pago not configured" }, { status: 503 })
        }

        // Mesmo bucket de rate limit dos outros provedores: o teto é do
        // checkout, não de cada provedor.
        const allowed = await checkPersistentRateLimit(
            "checkout:create",
            user.id || getClientIp(request),
            10,
            60_000
        )
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 })
        }

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
        const listIds = items.map((item) => item.listId)

        const lists = await prisma.leadList.findMany({
            where: { id: { in: listIds }, isActive: true },
        })

        if (lists.length !== items.length) {
            return NextResponse.json({ error: "Invalid items" }, { status: 400 })
        }

        // A moeda do carrinho não entra aqui. O Mercado Pago cobra em BRL e não
        // converte: mandar o número de outra moeda cobraria aquele número em
        // reais, sem erro de API.
        const prices = await resolveListPrices(prisma, listIds, "BRL")

        // Sem queda para EUR: a queda é comportamento de vitrine, e cobrar numa
        // moeda diferente da resolvida é cobrar diferente do combinado.
        const semPreco = lists.filter((list) => prices.get(list.id)?.currency !== "BRL")
        if (semPreco.length > 0) {
            return NextResponse.json(
                { error: "Item without price in BRL" },
                { status: 400 }
            )
        }

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

        // A compra nasce ANTES da preferência: o external_reference é o id dela.
        const purchase = await prisma.purchase.create({
            data: {
                userId: user.id,
                provider: "mercadopago",
                status: "pending",
                subtotal,
                total: subtotal,
                currency: "BRL",
                buyerEmail: user.email,
                items: {
                    create: purchaseItems.map((item) => ({
                        listId: item.listId,
                        price: item.price,
                        currency: "BRL",
                        leadsCount: item.leadsCount,
                    })),
                },
            },
        })

        const appUrl = getPublicAppUrl()

        let preference: { id: string; initPoint: string }
        try {
            preference = await createPreference({
                items: purchaseItems.map((item) => ({
                    id: item.listId,
                    title: item.name,
                    quantity: item.quantity,
                    unitPrice: item.price,
                })),
                payerEmail: user.email,
                externalReference: purchase.id,
                successUrl: `${appUrl}/checkout/mercadopago-return`,
                pendingUrl: `${appUrl}/checkout/mercadopago-return`,
                failureUrl: `${appUrl}/checkout/cancel`,
                notificationUrl: `${appUrl}/api/checkout/mercadopago/webhook`,
            })
        } catch (error) {
            // Compra criada sem preferência é pedido órfão: ela ocuparia o
            // backstop de pendentes do comprador sem nunca poder ser paga.
            console.error("[Mercado Pago] Falha ao criar preferência:", error)
            await prisma.purchase.updateMany({
                where: { id: purchase.id, status: "pending" },
                data: { status: "failed" },
            })
            return NextResponse.json({ error: "Failed to create preference" }, { status: 500 })
        }

        try {
            await prisma.purchase.update({
                where: { id: purchase.id },
                data: { mercadoPagoPreferenceId: preference.id },
            })
        } catch (error) {
            // Preferência criada mas não persistida no banco: o webhook do Mercado Pago
            // não encontrará o purchase para atualizar o pagamento. Marca como falha e
            // libera o slot do backstop de pendentes.
            console.error("[Mercado Pago] Falha ao persistir preferência:", {
                preferenceId: preference.id,
                purchaseId: purchase.id,
                error,
            })
            await prisma.purchase.updateMany({
                where: { id: purchase.id, status: "pending" },
                data: { status: "failed" },
            })
            return NextResponse.json({ error: "Failed to save preference" }, { status: 500 })
        }

        return NextResponse.json({
            url: preference.initPoint,
            purchaseId: purchase.id,
        })
    } catch (error) {
        console.error("Error creating Mercado Pago preference:", error)
        return NextResponse.json({ error: "Failed to create preference" }, { status: 500 })
    }
}
