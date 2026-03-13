// actions/admin/lists.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

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

interface MarketplaceLeadData {
    company: string
    email: string
    country: string
    city?: string
    industry?: string
    companySize?: string
    website?: string
    taxId?: string
    contactName?: string
    jobTitle?: string
    phone?: string
}

export async function createList(data: CreateListData) {
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

    revalidatePath("/admin/lists")
    revalidatePath("/catalog")

    return list
}

export async function updateList(id: string, data: CreateListData) {
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

    revalidatePath("/admin/lists")
    revalidatePath("/catalog")
    revalidatePath(`/list/${list.slug}`)

    return list
}

export async function deleteList(id: string) {
    await prisma.leadList.delete({
        where: { id },
    })

    revalidatePath("/admin/lists")
    revalidatePath("/catalog")
}

export async function toggleListActive(id: string, isActive: boolean) {
    await prisma.leadList.update({
        where: { id },
        data: { isActive },
    })

    revalidatePath("/admin/lists")
    revalidatePath("/catalog")
}

export async function uploadLeadsToList(listId: string, leads: MarketplaceLeadData[]) {
    // Criar leads em batch
    const created = await prisma.marketplaceLead.createMany({
        data: leads.map(lead => ({
            listId,
            company: lead.company,
            email: lead.email,
            country: lead.country.toUpperCase(),
            city: lead.city || null,
            industry: lead.industry || null,
            companySize: lead.companySize || null,
            website: lead.website || null,
            taxId: lead.taxId || null,
            contactName: lead.contactName || null,
            jobTitle: lead.jobTitle || null,
            phone: lead.phone || null,
            emailVerified: false,
        })),
        skipDuplicates: true,
    })

    // Atualizar contador da lista
    const count = await prisma.marketplaceLead.count({
        where: { listId }
    })

    await prisma.leadList.update({
        where: { id: listId },
        data: {
            totalLeads: count,
            previewData: await generatePreviewData(listId),
        }
    })

    revalidatePath(`/admin/lists/${listId}/leads`)
    revalidatePath("/catalog")

    return created
}

export async function deleteMarketplaceLead(leadId: string, listId: string) {
    await prisma.marketplaceLead.delete({
        where: { id: leadId }
    })

    // Atualizar contador
    const count = await prisma.marketplaceLead.count({
        where: { listId }
    })

    await prisma.leadList.update({
        where: { id: listId },
        data: {
            totalLeads: count,
            previewData: await generatePreviewData(listId),
        }
    })

    revalidatePath(`/admin/lists/${listId}/leads`)
    revalidatePath("/catalog")
}

// Função para gerar preview mascarado
async function generatePreviewData(listId: string) {
    const leads = await prisma.marketplaceLead.findMany({
        where: { listId },
        take: 5,
        orderBy: { createdAt: "asc" },
        select: {
            company: true,
            city: true,
            email: true,
            country: true,
        }
    })

    // Mascarar emails
    return leads.map(lead => ({
        company: lead.company,
        city: lead.city || "",
        email: maskEmail(lead.email),
        country: lead.country,
    }))
}

function maskEmail(email: string): string {
    const [local, domain] = email.split("@")
    if (!domain) return email

    const maskedLocal = local.slice(0, 3) + "****"
    return `${maskedLocal}@${domain}`
}

