// actions/admin/lists.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import type { MarketplaceLeadData } from "@/lib/constants/marketplace-csv.constants"
import type { LeadList } from "@prisma/client"
import { z } from "zod"
import { recordAudit } from "@/lib/audit"
import { canPublishList } from "@/lib/marketplace/list-publishing"

interface CreateListData {
    name: string
    slug: string
    description?: string
    introduction?: string
    language?: string
    category: string
    countries: string[]
    industries: string[]
    price: number
    currency: string
    isActive: boolean
    isFeatured: boolean
}

const listDataSchema = z.object({
    name: z.string().trim().min(3).max(160),
    slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9-]+$/),
    description: z.string().trim().max(5000).optional(),
    introduction: z.string().trim().max(10000).optional(),
    language: z.enum(["pt", "en", "de", "fr", "es", "it", "nl"]).optional(),
    category: z.string().trim().min(1).max(80),
    countries: z.array(z.string().trim().min(2).max(3)).min(1).max(100),
    industries: z.array(z.string().trim().min(1).max(80)).max(100),
    price: z.number().finite().positive().max(999999),
    currency: z.enum(["EUR", "USD", "BRL"]),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
})

// Tipo serializado para retornar ao client
interface SerializedList {
    id: string
    name: string
    slug: string
    description: string | null
    introduction: string | null
    language: string | null
    studyPdfUrl: string | null
    studyPdfName: string | null
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
    dataReviewedAt: string | null
}

// Função auxiliar para serializar lista
function serializeList(list: LeadList): SerializedList {
    return {
        ...list,
        price: Number(list.price),
        createdAt: list.createdAt.toISOString(),
        updatedAt: list.updatedAt.toISOString(),
        dataReviewedAt: list.dataReviewedAt?.toISOString() ?? null,
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
    const validated = listDataSchema.parse(data)

    // O estudo em PDF só é enviado depois que a lista existe (rota de upload
    // precisa do id). Uma lista recém-criada nunca tem studyPdfUrl ainda, então
    // não há como nascer ativa: força inativa e exige ativação explícita depois
    // (via updateList), quando o gate de canPublishList corre contra o
    // studyPdfUrl já anexado.
    const list = await prisma.leadList.create({
        data: {
            name: validated.name,
            slug: validated.slug,
            description: validated.description || null,
            introduction: validated.introduction || null,
            language: validated.language || null,
            category: validated.category,
            countries: validated.countries,
            industries: validated.industries,
            price: validated.price,
            currency: validated.currency,
            isActive: false,
            isFeatured: validated.isFeatured,
        },
    })

    revalidateListPaths(list.slug)

    return serializeList(list)
}

export async function updateList(id: string, data: CreateListData): Promise<SerializedList> {
    await requireAdmin()
    const validated = listDataSchema.parse(data)

    if (validated.isActive) {
        const current = await prisma.leadList.findUnique({
            where: { id },
            select: { studyPdfUrl: true, dataReviewedAt: true },
        })
        const check = canPublishList({
            studyPdfUrl: current?.studyPdfUrl ?? null,
            dataReviewedAt: current?.dataReviewedAt ?? null,
        })
        if (!check.ok) {
            throw new Error(check.reason)
        }
    }

    const list = await prisma.leadList.update({
        where: { id },
        data: {
            name: validated.name,
            slug: validated.slug,
            description: validated.description || null,
            introduction: validated.introduction || null,
            language: validated.language || null,
            category: validated.category,
            countries: validated.countries,
            industries: validated.industries,
            price: validated.price,
            currency: validated.currency,
            isActive: validated.isActive,
            isFeatured: validated.isFeatured,
        },
    })

    revalidateListPaths(list.slug)

    return serializeList(list)
}

export async function deleteList(id: string) {
    const admin = await requireAdmin()

    const list = await prisma.leadList.findUnique({
        where: { id },
        select: { slug: true, name: true }
    })

    await prisma.leadList.delete({
        where: { id },
    })

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "list.deleted",
        targetType: "list",
        targetId: id,
        metadata: { name: list?.name ?? null },
    })

    revalidateListPaths(list?.slug)
}

/**
 * Registra que os DADOS da lista foram efetivamente revisados agora.
 *
 * Deliberadamente separado de updateList: `updatedAt` muda a qualquer edição
 * (preço, typo na descrição) e por isso não serve como sinal de frescor. Só
 * esta ação, chamada explicitamente pelo admin, move `dataReviewedAt`.
 */
export async function markListReviewed(listId: string): Promise<string> {
    const admin = await requireAdmin()

    const reviewedAt = new Date()

    const list = await prisma.leadList.update({
        where: { id: listId },
        data: { dataReviewedAt: reviewedAt },
        select: { slug: true, name: true, dataReviewedAt: true },
    })

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "list.reviewed",
        targetType: "list",
        targetId: listId,
        metadata: { name: list.name, dataReviewedAt: reviewedAt.toISOString() },
    })

    revalidateListPaths(list.slug)

    return reviewedAt.toISOString()
}

export async function uploadLeadsToList(listId: string, leads: MarketplaceLeadData[]) {
    await requireAdmin()

    const listExists = await prisma.leadList.findUnique({
        where: { id: listId },
        select: { id: true },
    })

    if (!listExists) {
        throw new Error("Lista nao encontrada")
    }

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
    const admin = await requireAdmin()

    const lead = await prisma.marketplaceLead.findFirst({
        where: { id: leadId, listId },
        select: { id: true, companyName: true },
    })

    if (!lead) {
        throw new Error("Lead nao encontrado")
    }

    await prisma.marketplaceLead.delete({
        where: { id: lead.id },
    })

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "marketplace_lead.deleted",
        targetType: "marketplace_lead",
        targetId: leadId,
        metadata: { label: lead.companyName ?? null, listId },
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

function normalizePagination(page = 1, limit = 50) {
    return {
        page: Math.max(1, Math.floor(page)),
        limit: Math.min(100, Math.max(1, Math.floor(limit))),
    }
}

// Buscar leads de uma lista
export async function getListLeads(listId: string, page: number = 1, limit: number = 50) {
    await requireAdmin()

    const pagination = normalizePagination(page, limit)
    const skip = (pagination.page - 1) * pagination.limit

    const [leads, total] = await Promise.all([
        prisma.marketplaceLead.findMany({
            where: { listId },
            orderBy: { createdAt: "desc" },
            skip,
            take: pagination.limit,
        }),
        prisma.marketplaceLead.count({
            where: { listId },
        }),
    ])

    return {
        leads,
        total,
        pages: Math.ceil(total / pagination.limit),
        currentPage: pagination.page,
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
