"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { recordAudit } from "@/lib/audit"
import { checkAdminRateLimit } from "@/lib/rate-limit"
import { parseCurrency, DEFAULT_CURRENCY } from "@/lib/currency"
import { roundCommercial } from "@/lib/marketplace/list-prices"

/**
 * Semeia preços numa moeda a partir de uma taxa digitada pelo admin.
 *
 * A taxa serve para SEMEAR e desaparece: o valor gravado é fixo, editável, e
 * nenhuma tela volta a consultá-la. Não sobrescreve preço existente — rodar
 * duas vezes com taxas diferentes não desfaz um ajuste feito à mão.
 */
export async function seedPricesFromRate(
    currency: string,
    rate: number
): Promise<{ updated: number }> {
    const admin = await requireAdmin()
    await checkAdminRateLimit("list.prices.seed", admin.id, 5, 60_000)

    const target = parseCurrency(currency)
    if (!target || target === DEFAULT_CURRENCY) {
        throw new Error("Escolha BRL ou USD: o preço em euro é o de referência, não é gerado.")
    }
    if (!(rate > 0) || rate > 1000) {
        throw new Error("Taxa inválida.")
    }

    const semPreco = await prisma.leadList.findMany({
        where: { prices: { none: { currency: target } } },
        select: { id: true, prices: { where: { currency: DEFAULT_CURRENCY }, select: { amount: true } } },
    })

    let updated = 0
    for (const list of semPreco) {
        const euro = list.prices[0]
        if (!euro) continue

        await prisma.leadListPrice.create({
            data: {
                listId: list.id,
                currency: target,
                amount: roundCommercial(Number(euro.amount) * rate, target),
            },
        })
        updated += 1
    }

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "list.prices.seed",
        // A operação é em lote: o alvo é o conjunto de listas, não uma lista.
        // `targetType: "list"` é o mesmo valor usado por list.deleted e
        // list.reviewed em actions/admin/lists.ts.
        targetType: "list",
        targetId: `bulk:${target}`,
        metadata: { currency: target, rate, updated },
    })

    revalidatePath("/super-admin/marketplace/lists")
    revalidatePath("/catalog")

    return { updated }
}
