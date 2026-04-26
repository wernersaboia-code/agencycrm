// actions/admin/lists.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import type { MarketplaceLeadData } from "@/lib/constants/marketplace-csv.constants"
import type { LeadList } from "@prisma/client"

interface CreateListData {
    name: string
    slug: string
    description?: string
    category: string
    countries: string[]
    industries: string[]
    price: number
    currency: string
    isActive: boolean
    isFeatured: boolean
}

// Tipo serializado para retornar ao client
interface SerializedList {
    id: string
    name: string
    slug: string
    description: string | null
    category: string
    countries: string[]
    industries: string[]
    totalLeads: number
    price: number
    currency: string
    isActive: boolean
    isFeatured: boolean
    previewData: unknown
    createdAt: string
    updatedAt: string
}

// Função auxiliar para serializar lista
function serializeList(list: LeadList): SerializedList {
    return {
        ...list,
        price: Number(list.price),
        createdAt: list.createdAt.toISOString(),
        updatedAt: list.updatedAt.toISOString(),
    }
}

// Helper para revalidar todas as rotas relacionadas
function revalidateListPaths(listSlug?: string) {
    // Super Admin
    revalidatePath("/super-admin/marketplace")
    revalidatePath("/super-admin/marketplace/lists")

    // Catálogo público
    revalidatePath("/catalog")

    // Página específica da lista
    if (listSlug) {
        revalidatePath(`/list/${listSlug}`)
    }
}

export async function createList(data: CreateListData): Promise<SerializedList> {
    await requireAdmin()

    const list = await prisma.leadList.create({
        data: {
            name: data.name,
            slug: data.slug,
            description: data.description || null,
            category: data.category,
            countries: data.countries,
            industries: data.industries,
            price: data.price,
            currency: data.currency,
            isActive: data.isActive,
            isFeatured: data.isFeatured,
        },
    })

    revalidateListPaths(list.slug)

    return serializeList(list)
}

export async function updateList(id: string, data: CreateListData): Promise<SerializedList> {
    await requireAdmin()

    const list = await prisma.leadList.update({
        where: { id },
        data: {
            name: data.name,
            slug: data.slug,
            description: data.description || null,
            category: data.category,
            countries: data.countries,
            industries: data.industries,
            price: data.price,
            currency: data.currency,
            isActive: data.isActive,
            isFeatured: data.isFeatured,
        },
    })

    revalidateListPaths(list.slug)

    return serializeList(list)
}

export async function deleteList(id: string) {
    await requireAdmin()

    const list = await prisma.leadList.findUnique({
        where: { id },
        select: { slug: true }
    })

    await prisma.leadList.delete({
        where: { id },
    })

    revalidateListPaths(list?.slug)
}

export async function toggleListActive(id: string, isActive: boolean) {
    await requireAdmin()

    const list = await prisma.leadList.update({
        where: { id },
        data: { isActive },
    })

    revalidateListPaths(list.slug)
}

export async function uploadLeadsToList(listId: string, leads: MarketplaceLeadData[]) {
    await requireAdmin()

    // Criar leads em batch
    const created = await prisma.marketplaceLead.createMany({
        data: leads.map((lead) => {
            // Verificar se o lead está completo (tem email)
            const isComplete = Boolean(lead.emailGeneral?.trim())

            return {
                listId,
                // Obrigatórios
                country: lead.country.trim(),
                companyName: lead.companyName.trim(),
                // Email (agora opcional)
                emailGeneral: lead.emailGeneral?.trim().toLowerCase() || null,
                // Flag de completude
                isComplete,
                // Empresa
                companyType: lead.companyType?.trim() || null,
                sector: lead.sector?.trim() || null,
                website: lead.website?.trim() || null,
                contactForm: lead.contactForm?.trim() || null,
                // Telefones
                phoneGeneral: lead.phoneGeneral?.trim() || null,
                phonePurchasing: lead.phonePurchasing?.trim() || null,
                // Emails
                emailPurchasing: lead.emailPurchasing?.trim().toLowerCase() || null,
                // Contatos
                manager: lead.manager?.trim() || null,
                purchasingPerson: lead.purchasingPerson?.trim() || null,
                // Detalhes do negócio
                productPortfolio: lead.productPortfolio?.trim() || null,
                specialty: lead.specialty?.trim() || null,
                customerTypes: lead.customerTypes?.trim() || null,
                productTypes: lead.productTypes?.trim() || null,
                sourcing: lead.sourcing?.trim() || null,
                exportSales: lead.exportSales?.trim() || null,
                specialFocus: lead.specialFocus?.trim() || null,
                productKeywords: lead.productKeywords?.trim() || null,
                salesPointsCount: lead.salesPointsCount?.trim() || null,
                // Metadados
                emailVerified: false,
            }
        }),
        skipDuplicates: true,
    })

    // Atualizar contador e preview da lista
    const count = await prisma.marketplaceLead.count({
        where: { listId },
    })

    // Extrair países e setores únicos
    const uniqueCountries = [...new Set(leads.map((l) => l.country.trim()))]
    const uniqueSectors = [...new Set(leads.map((l) => l.sector?.trim()).filter(Boolean))] as string[]

    const list = await prisma.leadList.update({
        where: { id: listId },
        data: {
            totalLeads: count,
            countries: uniqueCountries,
            industries: uniqueSectors,
            previewData: await generatePreviewData(listId),
        },
    })

    revalidatePath(`/super-admin/marketplace/lists/${listId}/leads`)
    revalidateListPaths(list.slug)

    return { count: created.count }
}

export async function deleteMarketplaceLead(leadId: string, listId: string) {
    await requireAdmin()

    await prisma.marketplaceLead.delete({
        where: { id: leadId },
    })

    // Atualizar contador
    const count = await prisma.marketplaceLead.count({
        where: { listId },
    })

    const list = await prisma.leadList.update({
        where: { id: listId },
        data: {
            totalLeads: count,
            previewData: await generatePreviewData(listId),
        },
    })

    revalidatePath(`/super-admin/marketplace/lists/${listId}/leads`)
    revalidateListPaths(list.slug)
}

// Função para gerar preview mascarado
async function generatePreviewData(listId: string) {
    const leads = await prisma.marketplaceLead.findMany({
        where: { listId },
        take: 5,
        orderBy: { createdAt: "asc" },
        select: {
            companyName: true,
            country: true,
            sector: true,
            emailGeneral: true,
        },
    })

    return leads.map((lead) => ({
        companyName: lead.companyName,
        country: lead.country,
        sector: lead.sector || "",
        email: lead.emailGeneral ? maskEmail(lead.emailGeneral) : "—",
    }))
}

function maskEmail(email: string): string {
    const [local, domain] = email.split("@")
    if (!domain) return email

    const maskedLocal = local.slice(0, 3) + "****"
    return `${maskedLocal}@${domain}`
}

// Buscar leads de uma lista
export async function getListLeads(listId: string, page: number = 1, limit: number = 50) {
    await requireAdmin()

    const skip = (page - 1) * limit

    const [leads, total] = await Promise.all([
        prisma.marketplaceLead.findMany({
            where: { listId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.marketplaceLead.count({
            where: { listId },
        }),
    ])

    return {
        leads,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
    }
}

// Estatísticas de uma lista
export async function getListStats(listId: string) {
    await requireAdmin()

    const leads = await prisma.marketplaceLead.findMany({
        where: { listId },
        select: {
            country: true,
            sector: true,
            emailVerified: true,
            isComplete: true,
        },
    })

    const countries = [...new Set(leads.map((l) => l.country))]
    const sectors = [...new Set(leads.map((l) => l.sector).filter(Boolean))]
    const verified = leads.filter((l) => l.emailVerified).length
    const complete = leads.filter((l) => l.isComplete).length
    const incomplete = leads.filter((l) => !l.isComplete).length

    return {
        total: leads.length,
        countries: countries.length,
        sectors: sectors.length,
        verified,
        verifiedPercentage: leads.length > 0 ? Math.round((verified / leads.length) * 100) : 0,
        complete,
        incomplete,
    }
}
