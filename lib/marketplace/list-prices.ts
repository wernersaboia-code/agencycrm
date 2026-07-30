import type { PrismaClient } from "@prisma/client"
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES, type Currency } from "@/lib/currency"

export interface ResolvedPrice {
    amount: number
    currency: Currency
    isFallback: boolean
}

export interface StoredPrice {
    currency: string
    amount: { toString(): string } | number | string
}

/**
 * Escolhe o preço a exibir. `isFallback` existe para a tela poder avisar que
 * está mostrando euro — o que nunca pode acontecer é R$ sobre um valor em EUR.
 *
 * `null` quando nem EUR existe: a lista não tem preço, e inventar um seria
 * pior que não exibir.
 */
export function pickPrice(prices: StoredPrice[], wanted: Currency): ResolvedPrice | null {
    const exact = prices.find((p) => p.currency === wanted)
    if (exact) {
        return { amount: Number(exact.amount.toString()), currency: wanted, isFallback: false }
    }

    const fallback = prices.find((p) => p.currency === DEFAULT_CURRENCY)
    if (fallback) {
        return {
            amount: Number(fallback.amount.toString()),
            currency: DEFAULT_CURRENCY,
            isFallback: true,
        }
    }

    return null
}

type PriceDb = Pick<PrismaClient, "leadListPrice" | "leadList" | "$transaction">

/**
 * Uma consulta só para todas as listas da página — evitar N+1 aqui importa: o
 * catálogo renderiza 12 cards por vez.
 */
export async function resolveListPrices(
    db: PriceDb,
    listIds: string[],
    wanted: Currency
): Promise<Map<string, ResolvedPrice>> {
    const result = new Map<string, ResolvedPrice>()
    if (listIds.length === 0) return result

    const rows = await db.leadListPrice.findMany({
        where: { listId: { in: listIds } },
        select: { listId: true, currency: true, amount: true },
    })

    for (const listId of listIds) {
        const price = pickPrice(
            rows.filter((row) => row.listId === listId),
            wanted
        )
        if (price) result.set(listId, price)
    }

    return result
}

/**
 * ÚNICO caminho de escrita de preço no sistema.
 *
 * O preço em EUR vive em dois lugares — `LeadListPrice` (fonte de verdade da
 * leitura) e `LeadList.price` (espelho que SEO, super-admin e e-mail já
 * consomem). Concentrar a escrita aqui, numa transação, é o que impede os dois
 * divergirem. Nenhum outro módulo grava preço.
 *
 * Moeda ausente do objeto = a lista deixa de ter preço nela (a linha é
 * apagada). EUR nunca pode ser ausente.
 */
export async function writeListPrices(
    db: PriceDb,
    listId: string,
    amounts: Partial<Record<Currency, number>>
): Promise<void> {
    const eur = amounts[DEFAULT_CURRENCY]
    if (eur === undefined) {
        throw new Error("Preço em EUR é obrigatório: é a moeda de referência da lista.")
    }

    for (const [currency, amount] of Object.entries(amounts)) {
        if (amount !== undefined && !(amount > 0)) {
            throw new Error(`Preço em ${currency} precisa ser positivo.`)
        }
    }

    const toRemove = SUPPORTED_CURRENCIES.filter((c) => amounts[c] === undefined)

    await db.$transaction(async (tx) => {
        for (const currency of SUPPORTED_CURRENCIES) {
            const amount = amounts[currency]
            if (amount === undefined) continue

            await tx.leadListPrice.upsert({
                where: { listId_currency: { listId, currency } },
                create: { listId, currency, amount },
                update: { amount },
            })
        }

        if (toRemove.length > 0) {
            await tx.leadListPrice.deleteMany({
                where: { listId, currency: { in: toRemove } },
            })
        }

        await tx.leadList.update({
            where: { id: listId },
            data: { price: eur, currency: DEFAULT_CURRENCY },
        })
    })
}

/**
 * Um carrinho com duas moedas não tem total. Se qualquer item não tem preço na
 * moeda escolhida, o carrinho inteiro cai para EUR — e quem chama avisa a
 * pessoa, porque o número na tela acabou de mudar sem ela ter pedido.
 */
export function cartCurrencyFor(
    prices: Map<string, ResolvedPrice>,
    wanted: Currency
): { currency: Currency; fellBack: boolean } {
    for (const price of prices.values()) {
        if (price.isFallback) {
            return { currency: DEFAULT_CURRENCY, fellBack: true }
        }
    }
    return { currency: wanted, fellBack: false }
}
