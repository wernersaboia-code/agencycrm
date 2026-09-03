// app/api/checkout/mercadopago/quote/route.ts
//
// Total do carrinho em BRL, para o checkout poder dizer ao comprador quanto
// vai ser cobrado ANTES de ele sair do site.
//
// Existe porque o Mercado Pago cobra sempre em reais, inclusive para quem está
// vendo preço em EUR ou USD. Mostrar um valor e cobrar outro sem avisar é a
// falha que este endpoint existe para evitar — e o número tem que vir do
// servidor, como todo preço neste projeto.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"
import { getClientIp, checkPersistentRateLimit } from "@/lib/rate-limit"
import { checkoutRequestSchema } from "@/lib/checkout/request-schema"
import { resolveListPrices } from "@/lib/marketplace/list-prices"
import { isMercadoPagoConfigured } from "@/lib/mercadopago"

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedActiveDbUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!isMercadoPagoConfigured()) {
            return NextResponse.json({ error: "Mercado Pago not configured" }, { status: 503 })
        }

        const allowed = await checkPersistentRateLimit(
            "checkout:quote",
            user.id || getClientIp(request),
            30,
            60_000
        )
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 })
        }

        const parsedBody = checkoutRequestSchema.safeParse(await request.json())

        if (!parsedBody.success) {
            return NextResponse.json({ error: "Invalid checkout items" }, { status: 400 })
        }

        const { items } = parsedBody.data
        const listIds = items.map((item) => item.listId)

        const lists = await prisma.leadList.findMany({
            where: { id: { in: listIds }, isActive: true },
            select: { id: true },
        })

        if (lists.length !== items.length) {
            return NextResponse.json({ error: "Invalid items" }, { status: 400 })
        }

        // A moeda do corpo é ignorada de propósito: a cotação é sempre em BRL,
        // porque a cobrança é sempre em BRL.
        const prices = await resolveListPrices(prisma, listIds, "BRL")

        const semPreco = lists.filter((list) => prices.get(list.id)?.currency !== "BRL")
        if (semPreco.length > 0) {
            return NextResponse.json(
                { error: "Item without price in BRL" },
                { status: 400 }
            )
        }

        let total = 0
        for (const item of items) {
            total += prices.get(item.listId)!.amount
        }

        return NextResponse.json({ total, currency: "BRL" })
    } catch (error) {
        console.error("Error quoting Mercado Pago cart:", error)
        return NextResponse.json({ error: "Failed to quote" }, { status: 500 })
    }
}
