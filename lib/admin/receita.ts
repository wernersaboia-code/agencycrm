// lib/admin/receita.ts
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"

/**
 * Filtro de toda métrica de venda do painel: compra marcada como teste na tela
 * de Vendas não é receita, não é venda e não entra no ticket médio.
 */
export const VENDA_REAL = { isTest: false } satisfies Prisma.PurchaseWhereInput

/** Receita de uma moeda. Valores de moedas diferentes nunca se somam. */
export interface ReceitaNaMoeda {
    currency: string
    total: number
    vendas: number
}

/**
 * Soma as compras separando por moeda.
 *
 * Desde o Mercado Pago o catálogo cobra em real e em euro, e somar `total`
 * direto juntava R$ 1,00 com 5,00 € e exibia 6,00 € — a receita do painel
 * passava a ser um número sem unidade.
 */
export async function receitaPorMoeda(where: Prisma.PurchaseWhereInput): Promise<ReceitaNaMoeda[]> {
    const grupos = await prisma.purchase.groupBy({
        by: ["currency"],
        where: { ...where, ...VENDA_REAL },
        _sum: { total: true },
        _count: { _all: true },
    })
    return ordenarReceitas(
        grupos.map((grupo) => ({
            currency: grupo.currency,
            total: Number(grupo._sum.total ?? 0),
            vendas: grupo._count._all,
        }))
    )
}

/** Euro primeiro (moeda de referência do catálogo), depois as outras por valor. */
export function ordenarReceitas(receitas: ReceitaNaMoeda[]): ReceitaNaMoeda[] {
    return [...receitas].sort((a, b) => {
        if (a.currency === "EUR") return -1
        if (b.currency === "EUR") return 1
        return b.total - a.total
    })
}

/** "50,00 € · R$ 1,00". Sem venda nenhuma, mostra zero em euro. */
export function formatarReceita(receitas: ReceitaNaMoeda[]): string {
    if (receitas.length === 0) return formatCurrency(0, "EUR")
    return receitas.map((receita) => formatCurrency(receita.total, receita.currency)).join(" · ")
}

/** Ticket médio de cada moeda, no mesmo formato. */
export function formatarTicketMedio(receitas: ReceitaNaMoeda[]): string {
    const comVenda = receitas.filter((receita) => receita.vendas > 0)
    if (comVenda.length === 0) return formatCurrency(0, "EUR")
    return comVenda
        .map((receita) => formatCurrency(receita.total / receita.vendas, receita.currency))
        .join(" · ")
}
