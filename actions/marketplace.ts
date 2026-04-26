// actions/marketplace.ts
"use server"

import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

interface GetListsParams {
    countries?: string[]
    industries?: string[]
    category?: string // ← ADICIONAR
    search?: string
    page?: number
    limit?: number
}

export async function getMarketplaceLists(params: GetListsParams = {}) {
    const {
        countries = [],
        industries = [],
        category, // ← ADICIONAR
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

    // Filtro de categoria ← ADICIONAR
    if (category) {
        where.category = category
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

    return {
        lists: lists.map((list) => ({
            ...list,
            price: Number(list.price),
        })),
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
            category: true, // ← ADICIONAR
        },
    })

    // Contar ocorrências de países
    const countryCounts: Record<string, number> = {}
    const industryCounts: Record<string, number> = {}
    const categoryCounts: Record<string, number> = {} // ← ADICIONAR

    lists.forEach((list) => {
        list.countries.forEach((country) => {
            countryCounts[country] = (countryCounts[country] || 0) + 1
        })
        list.industries.forEach((industry) => {
            industryCounts[industry] = (industryCounts[industry] || 0) + 1
        })
        // ← ADICIONAR
        if (list.category) {
            categoryCounts[list.category] = (categoryCounts[list.category] || 0) + 1
        }
    })

    return { countryCounts, industryCounts, categoryCounts } // ← ADICIONAR categoryCounts
}
