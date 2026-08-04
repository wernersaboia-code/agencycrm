// actions/marketplace.ts
"use server"

import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { getActiveCurrency } from "@/lib/currency/server"
import { resolveListPrices } from "@/lib/marketplace/list-prices"

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

    const currency = await getActiveCurrency()
    const prices = await resolveListPrices(prisma, lists.map((l) => l.id), currency)

    // O card recebe o preço JÁ resolvido: `price` e `currency` passam a
    // significar "o que esta pessoa vê", não "o que a lista custa em euro".
    // Lista sem preço nenhum mantém o valor da coluna antiga em vez de
    // desaparecer da vitrine.
    const listsWithPrice = lists.map((list) => {
        const resolved = prices.get(list.id)
        return {
            ...list,
            price: resolved ? resolved.amount : Number(list.price),
            currency: resolved ? resolved.currency : list.currency,
            priceIsFallback: resolved?.isFallback ?? false,
        }
    })

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
