// actions/marketplace.ts
"use server"

import { prisma } from "@/lib/prisma"
import type { LeadList, Prisma } from "@prisma/client"
import { getActiveCurrency } from "@/lib/currency/server"
import { resolveListPrices } from "@/lib/marketplace/list-prices"

/**
 * O card recebe o preço JÁ resolvido: `price` e `currency` passam a significar
 * "o que esta pessoa vê", não "o que a lista custa em euro". Lista sem preço
 * na moeda ativa mantém o valor da coluna antiga em vez de sumir da vitrine.
 *
 * Fica separado porque o catálogo e a home precisam do mesmo tratamento, e um
 * preço resolvido só num dos dois lugares é pior que preço nenhum: a home
 * anunciaria um valor e a página da lista mostraria outro.
 */
async function comPrecoDoVisitante(lists: LeadList[]) {
    const currency = await getActiveCurrency()
    const prices = await resolveListPrices(prisma, lists.map((l) => l.id), currency)

    return lists.map((list) => {
        const resolved = prices.get(list.id)
        return {
            ...list,
            price: resolved ? resolved.amount : Number(list.price),
            currency: resolved ? resolved.currency : list.currency,
            priceIsFallback: resolved?.isFallback ?? false,
        }
    })
}

/**
 * Estudos marcados como destaque no admin, para a vitrine da home.
 *
 * `isFeatured` já existia — coluna indexada, toggle no formulário do admin,
 * selo no card e ordenação do catálogo. Só não havia nada na home consumindo.
 *
 * Devolver lista vazia é resultado legítimo, e a seção some: home com bloco de
 * destaques vazio é promessa que a página não cumpre, o mesmo critério que já
 * vale para a amostra grátis e para as facetas do catálogo.
 */
export async function getFeaturedLists(limite = 4) {
    const lists = await prisma.leadList.findMany({
        where: { isActive: true, isFeatured: true },
        orderBy: { updatedAt: "desc" },
        take: limite,
    })

    return comPrecoDoVisitante(lists)
}

interface GetListsParams {
    countries?: string[]
    industries?: string[]
    languages?: string[]
    search?: string
    page?: number
    limit?: number
}

export async function getMarketplaceLists(params: GetListsParams = {}) {
    const {
        countries = [],
        industries = [],
        languages = [],
        search = "",
        page = 1,
        limit = 12,
    } = params

    const skip = (page - 1) * limit

    // Construir filtros dinâmicos
    const where: Prisma.LeadListWhereInput = {
        isActive: true,
    }

    // Filtro de países (lista tem array de países)
    if (countries.length > 0) {
        where.countries = {
            hasSome: countries,
        }
    }

    // Filtro de indústrias
    if (industries.length > 0) {
        where.industries = {
            hasSome: industries,
        }
    }

    // `language` é coluna escalar, não array: casa por inclusão, não por hasSome.
    if (languages.length > 0) {
        where.language = { in: languages }
    }

    // Busca por nome ou descrição
    if (search.trim()) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ]
    }

    // Buscar listas com contagem total
    const [lists, total] = await Promise.all([
        prisma.leadList.findMany({
            where,
            orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
            skip,
            take: limit,
        }),
        prisma.leadList.count({ where }),
    ])

    const listsWithPrice = await comPrecoDoVisitante(lists)

    return {
        lists: listsWithPrice,
        total,
        pages: Math.ceil(total / limit),
    }
}

// Action para obter contadores de filtros (sidebar)
export async function getFilterCounts() {
    const lists = await prisma.leadList.findMany({
        where: { isActive: true },
        select: {
            countries: true,
            industries: true,
            language: true,
        },
    })

    // Contar ocorrências de países
    const countryCounts: Record<string, number> = {}
    const industryCounts: Record<string, number> = {}
    const languageCounts: Record<string, number> = {}

    lists.forEach((list) => {
        list.countries.forEach((country) => {
            countryCounts[country] = (countryCounts[country] || 0) + 1
        })
        list.industries.forEach((industry) => {
            industryCounts[industry] = (industryCounts[industry] || 0) + 1
        })
        if (list.language) {
            languageCounts[list.language] = (languageCounts[list.language] || 0) + 1
        }
    })

    return { countryCounts, industryCounts, languageCounts }
}
