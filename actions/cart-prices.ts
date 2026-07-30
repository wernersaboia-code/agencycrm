"use server"

import { prisma } from "@/lib/prisma"
import { DEFAULT_CURRENCY, parseCurrency, type Currency } from "@/lib/currency"
import { resolveListPrices, cartCurrencyFor } from "@/lib/marketplace/list-prices"

export interface RepricedCart {
    currency: Currency
    fellBack: boolean
    prices: Record<string, number>
}

/**
 * Reprecifica o carrinho no servidor. O `localStorage` guarda preço só para a
 * tela não piscar; ele nunca é fonte de verdade — as rotas de checkout já
 * ignoram qualquer valor vindo do cliente.
 */
export async function resolveCartPrices(listIds: string[], currency: string): Promise<RepricedCart> {
    const wanted = parseCurrency(currency) ?? DEFAULT_CURRENCY
    const resolved = await resolveListPrices(prisma, listIds, wanted)
    const { currency: effective, fellBack } = cartCurrencyFor(resolved, wanted)

    // Na queda, TODOS os itens são relidos em euro de uma vez — inclusive os
    // que tinham preço na moeda pedida, que no primeiro mapa estão com o valor
    // na moeda errada para o total que vai ser exibido.
    const final = fellBack ? await resolveListPrices(prisma, listIds, DEFAULT_CURRENCY) : resolved

    const prices: Record<string, number> = {}
    for (const [listId, price] of final) {
        prices[listId] = price.amount
    }

    return { currency: effective, fellBack, prices }
}
