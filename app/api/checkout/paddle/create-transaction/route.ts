// app/api/checkout/paddle/create-transaction/route.ts
//
// Cria a Purchase pendente e a transação do Paddle.
//
// A ordem segue a do Mercado Pago e pela mesma razão: quem amarra a transação
// ao pedido é o `custom_data`, que carrega o nosso purchase.id. Ele precisa
// existir antes da transação.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getClientIp, checkPersistentRateLimit } from "@/lib/rate-limit"
import { createTransaction, isPaddleConfigured } from "@/lib/paddle"
import { checkoutRequestSchema } from "@/lib/checkout/request-schema"
import { resolveListPrices } from "@/lib/marketplace/list-prices"
import { providerForCurrency } from "@/lib/checkout/currency-guard"

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!isPaddleConfigured()) {
            return NextResponse.json({ error: "Paddle not configured" }, { status: 503 })
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

        const { items, currency } = parsedBody.data

        // A guarda vale no servidor, não só na tela. Carrinho em BRL aqui
        // significa que alguém chamou a rota direto — e o Paddle não é o
        // caminho de quem paga em reais.
        if (providerForCurrency(currency) !== "paddle") {
            return NextResponse.json(
                { error: "Currency not handled by Paddle" },
                { status: 400 }
            )
        }

        const listIds = items.map((item) => item.listId)

        const lists = await prisma.leadList.findMany({
            where: { id: { in: listIds }, isActive: true },
        })

        if (lists.length !== items.length) {
            return NextResponse.json({ error: "Invalid items" }, { status: 400 })
        }

        const prices = await resolveListPrices(prisma, listIds, currency)

        // Sem queda para EUR quando o carrinho é USD: a queda é comportamento
        // de vitrine, e cobrar numa moeda diferente da resolvida é cobrar
        // diferente do combinado.
        const semPreco = lists.filter((list) => prices.get(list.id)?.currency !== currency)
        if (semPreco.length > 0) {
            return NextResponse.json(
                { error: "Item without price in requested currency" },
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

        // A compra nasce ANTES da transação: o custom_data é o id dela.
        const purchase = await prisma.purchase.create({
            data: {
                userId: user.id,
                provider: "paddle",
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

        let transaction: { id: string }
        try {
            transaction = await createTransaction({
                items: purchaseItems.map((item) => ({
                    name: item.name,
                    description: item.name,
                    quantity: item.quantity,
                    unitPrice: item.price,
                })),
                currencyCode: currency,
                purchaseId: purchase.id,
            })
        } catch (error) {
            // Compra criada sem transação é pedido órfão: ela ocuparia o
            // backstop de pendentes do comprador sem nunca poder ser paga.
            console.error("[Paddle] Falha ao criar transação:", error)
            await prisma.purchase.updateMany({
                where: { id: purchase.id, status: "pending" },
                data: { status: "failed" },
            })
            return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
        }

        // Gravação separada e tolerante: a transação já existe e é pagável, e
        // esta coluna serve só para conciliação. Derrubar a compra aqui seria
        // trocar um pedido pagável por um erro.
        try {
            await prisma.purchase.update({
                where: { id: purchase.id },
                data: { paddleTransactionId: transaction.id },
            })
        } catch (error) {
            console.error("[Paddle] Falha ao gravar paddleTransactionId:", error)
        }

        return NextResponse.json({
            transactionId: transaction.id,
            purchaseId: purchase.id,
            // Devolvido para o overlay pré-preencher o campo de e-mail. Sem
            // isso, o Paddle só conhece o que o comprador digitar ali — e o
            // recibo do vendedor registrado sai para um endereço que pode não
            // ser o da conta, deixando a compra sem rastro no painel dele.
            // Não é vazamento: é o e-mail da própria pessoa autenticada.
            customerEmail: user.email,
        })
    } catch (error) {
        console.error("Error creating Paddle transaction:", error)
        return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }
}
