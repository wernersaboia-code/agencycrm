"use server"

import { prisma } from "@/lib/prisma"
import { DEFAULT_CURRENCY, parseCurrency, type Currency } from "@/lib/currency"
import { resolveListPrices, cartCurrencyFor } from "@/lib/marketplace/list-prices"

export interface RepricedCart {
    currency: Currency
    fellBack: boolean
    prices: Record<string, number>
    /** Ids que não voltaram com preço em moeda nenhuma — lista sumiu ou ficou sem preço. */
    unpriced: string[]
}

// Server action é endpoint HTTP público: nada impede o cliente de mandar um
// array arbitrariamente grande de ids para forçar um IN (...) gigante no
// banco. O checkout já limita a 50 itens (app/api/checkout/*/route.ts); usamos
// o mesmo número aqui e simplesmente ignoramos o excedente em vez de devolver
// erro — o carrinho real nunca chega perto disso, então truncar é inofensivo
// e evita mais uma resposta de erro para o cliente tratar.
const MAX_CART_ITEMS = 50

/**
 * Reprecifica o carrinho no servidor. O `localStorage` guarda preço só para a
 * tela não piscar; ele nunca é fonte de verdade — as rotas de checkout já
 * ignoram qualquer valor vindo do cliente.
 */
export async function resolveCartPrices(listIds: string[], currency: string): Promise<RepricedCart> {
    const ids = listIds.slice(0, MAX_CART_ITEMS)
    const wanted = parseCurrency(currency) ?? DEFAULT_CURRENCY
    const resolved = await resolveListPrices(prisma, ids, wanted)
    const { currency: effective, fellBack } = cartCurrencyFor(resolved, wanted)

    // Na queda, TODOS os itens são relidos em euro de uma vez — inclusive os
    // que tinham preço na moeda pedida, que no primeiro mapa estão com o valor
    // na moeda errada para o total que vai ser exibido.
    const final = fellBack ? await resolveListPrices(prisma, ids, DEFAULT_CURRENCY) : resolved

    const prices: Record<string, number> = {}
    for (const [listId, price] of final) {
        prices[listId] = price.amount
    }

    const unpriced = ids.filter((id) => prices[id] === undefined)

    return { currency: effective, fellBack, prices, unpriced }
}
