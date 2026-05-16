import type { PrismaClient, LeadStatus, CompanySize } from "@prisma/client"
import type { ServiceContext } from "@/lib/auth/context"
import type {
    CreateLeadData,
    UpdateLeadData,
} from "@/lib/validations/lead.validations"
import { sanitizeLeadData } from "@/lib/utils/lead.utils"

// ============================================================
// TIPOS
// ============================================================

export interface LeadWithRelations {
    id: string
    firstName: string
    lastName: string | null
    email: string
    phone: string | null
    mobile: string | null
    company: string | null
    jobTitle: string | null
    website: string | null
    taxId: string | null
    industry: string | null
    companySize: CompanySize | null
    address: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    country: string | null
    status: LeadStatus
    source: string
    notes: string | null
    workspaceId: string
    createdAt: Date
    updatedAt: Date
}

export interface LeadStats {
    total: number
    new: number
    interested: number
    converted: number
}

export interface GetLeadsParams {
    workspaceId: string
    search?: string
    status?: LeadStatus
    country?: string
    industry?: string
    page?: number
    pageSize?: number
}

export interface ImportLeadData {
    firstName: string
    lastName?: string | null
    email: string
    phone?: string | null
    mobile?: string | null
    company?: string | null
    jobTitle?: string | null
    website?: string | null
    taxId?: string | null
    industry?: string | null
    companySize?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    country?: string | null
    notes?: string | null
}

export interface ImportResult {
    success: boolean
    imported: number
    duplicates: number
    errors: number
    errorDetails: Array<{
        row: number
        email: string
        reason: string
    }>
}

// ============================================================
// QUERIES
// ============================================================

export async function getLeads(
    prisma: PrismaClient,
    params: GetLeadsParams
): Promise<{
    leads: LeadWithRelations[]
    total: number
    stats: LeadStats
}> {
    const {
        workspaceId,
        search,
        status,
        country,
        industry,
        page = 1,
        pageSize = 50,
    } = params

    const where = {
        workspaceId,
        ...(status && { status }),
        ...(country && { country }),
        ...(industry && { industry }),
        ...(search && {
            OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
                { company: { contains: search, mode: "insensitive" as const } },
            ],
        }),
    }

    const [leads, total, stats] = await Promise.all([
        prisma.lead.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                _count: {
                    select: {
                        emailSends: true,
                        calls: true,
                    },
                },
            },
        }),
        prisma.lead.count({ where }),
        getLeadStats(prisma, workspaceId),
    ])

    return {
        leads: leads as unknown as LeadWithRelations[],
        total,
        stats,
    }
}

export async function getLeadById(
    prisma: PrismaClient,
    ctx: ServiceContext,
    id: string
): Promise<LeadWithRelations | null> {
    const lead = await prisma.lead.findFirst({
        where: {
            id,
            workspace: { userId: ctx.user.id },
        },
    })
    return (lead as unknown as LeadWithRelations | null) ?? null
}

export async function getLeadStats(
    prisma: PrismaClient,
    workspaceId: string
): Promise<LeadStats> {
    const [total, newCount, interested, converted] = await Promise.all([
        prisma.lead.count({ where: { workspaceId } }),
        prisma.lead.count({ where: { workspaceId, status: "NEW" } }),
        prisma.lead.count({ where: { workspaceId, status: "INTERESTED" } }),
        prisma.lead.count({ where: { workspaceId, status: "CONVERTED" } }),
    ])

    return { total, new: newCount, interested, converted }
}

export async function getLeadEmailSends(
    prisma: PrismaClient,
    ctx: ServiceContext,
    leadId: string
): Promise<
    Array<{
        id: string
        campaignName: string
        status: string
        sentAt: string | null
        openedAt: string | null
        clickedAt: string | null
    }>
> {
    const emailSends = await prisma.emailSend.findMany({
        where: {
            leadId,
            campaign: {
                workspace: { userId: ctx.user.id },
            },
        },
        include: {
            campaign: {
                select: { name: true },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    return emailSends.map((send) => ({
        id: send.id,
        campaignName: send.campaign.name,
        status: send.status,
        sentAt: send.sentAt?.toISOString() ?? null,
        openedAt: send.openedAt?.toISOString() ?? null,
        clickedAt: send.clickedAt?.toISOString() ?? null,
    }))
}

// ============================================================
// MUTATIONS
// ============================================================

export async function createLead(
    prisma: PrismaClient,
    data: CreateLeadData
): Promise<LeadWithRelations> {
    const existingLead = await prisma.lead.findUnique({
        where: {
            email_workspaceId: {
                email: data.email,
                workspaceId: data.workspaceId,
            },
        },
    })

    if (existingLead) {
        throw new Error("DUPLICATE_EMAIL")
    }

    const sanitizedData = sanitizeLeadData(data)

    const lead = await prisma.lead.create({
        data: sanitizedData as Parameters<typeof prisma.lead.create>[0]["data"],
    })

    return lead as unknown as LeadWithRelations
}

export async function updateLead(
    prisma: PrismaClient,
    ctx: ServiceContext,
    id: string,
    data: UpdateLeadData
): Promise<LeadWithRelations> {
    const existingLead = await prisma.lead.findFirst({
        where: {
            id,
            workspace: { userId: ctx.user.id },
        },
    })

    if (!existingLead) {
        throw new Error("LEAD_NOT_FOUND")
    }

    if (data.email && data.email !== existingLead.email) {
        const duplicateEmail = await prisma.lead.findFirst({
            where: {
                email: data.email,
                workspaceId: existingLead.workspaceId,
                NOT: { id },
            },
        })

        if (duplicateEmail) {
            throw new Error("DUPLICATE_EMAIL")
        }
    }

    const sanitizedData = sanitizeLeadData(data)

    const lead = await prisma.lead.update({
        where: { id },
        data: sanitizedData as Parameters<typeof prisma.lead.update>[0]["data"],
    })

    return lead as unknown as LeadWithRelations
}

export async function deleteLead(
    prisma: PrismaClient,
    ctx: ServiceContext,
    id: string
): Promise<void> {
    const lead = await prisma.lead.findFirst({
        where: {
            id,
            workspace: { userId: ctx.user.id },
        },
    })

    if (!lead) {
        throw new Error("LEAD_NOT_FOUND")
    }

    await prisma.lead.delete({ where: { id } })
}

export async function deleteMultipleLeads(
    prisma: PrismaClient,
    ctx: ServiceContext,
    ids: string[]
): Promise<number> {
    const result = await prisma.lead.deleteMany({
        where: {
            id: { in: ids },
            workspace: { userId: ctx.user.id },
        },
    })

    return result.count
}

function isValidCompanySize(value: string | null | undefined): boolean {
    if (!value) return false
    const validSizes = ["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]
    return validSizes.includes(value.toUpperCase())
}

function generateImportBatchId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export async function importLeads(
    prisma: PrismaClient,
    workspaceId: string,
    leads: ImportLeadData[]
): Promise<ImportResult> {
    const importBatch = generateImportBatchId()
    const importedAt = new Date()

    let imported = 0
    let duplicates = 0
    let errors = 0
    const errorDetails: ImportResult["errorDetails"] = []

    const existingEmails = await prisma.lead.findMany({
        where: { workspaceId },
        select: { email: true },
    })
    const existingEmailSet = new Set(existingEmails.map((e) => e.email.toLowerCase()))

    const leadsToCreate: Array<{
        firstName: string
        lastName: string | null
        email: string
        phone: string | null
        mobile: string | null
        company: string | null
        jobTitle: string | null
        website: string | null
        taxId: string | null
        industry: string | null
        companySize: CompanySize | null
        address: string | null
        city: string | null
        state: string | null
        postalCode: string | null
        country: string | null
        notes: string | null
        status: "NEW"
        source: "IMPORT"
        workspaceId: string
        importBatch: string
        importedAt: Date
    }> = []

    leads.forEach((lead, index) => {
        const email = lead.email?.trim().toLowerCase()

        if (!email) {
            errors++
            errorDetails.push({
                row: index + 1,
                email: lead.email || "(vazio)",
                reason: "Email é obrigatório",
            })
            return
        }

        if (!lead.firstName?.trim()) {
            errors++
            errorDetails.push({
                row: index + 1,
                email,
                reason: "Nome é obrigatório",
            })
            return
        }

        if (existingEmailSet.has(email)) {
            duplicates++
            return
        }

        existingEmailSet.add(email)

        let validCompanySize: CompanySize | null = null
        if (lead.companySize && isValidCompanySize(lead.companySize)) {
            validCompanySize = lead.companySize.toUpperCase() as CompanySize
        }

        leadsToCreate.push({
            firstName: lead.firstName.trim(),
            lastName: lead.lastName?.trim() || null,
            email,
            phone: lead.phone?.trim() || null,
            mobile: lead.mobile?.trim() || null,
            company: lead.company?.trim() || null,
            jobTitle: lead.jobTitle?.trim() || null,
            website: lead.website?.trim() || null,
            taxId: lead.taxId?.trim() || null,
            industry: lead.industry?.trim() || null,
            companySize: validCompanySize,
            address: lead.address?.trim() || null,
            city: lead.city?.trim() || null,
            state: lead.state?.trim() || null,
            postalCode: lead.postalCode?.trim() || null,
            country: lead.country?.trim()?.toUpperCase()?.substring(0, 2) || null,
            notes: lead.notes?.trim() || null,
            status: "NEW",
            source: "IMPORT",
            workspaceId,
            importBatch,
            importedAt,
        })
    })

    const BATCH_SIZE = 100
    for (let i = 0; i < leadsToCreate.length; i += BATCH_SIZE) {
        const batch = leadsToCreate.slice(i, i + BATCH_SIZE)
        await prisma.lead.createMany({
            data: batch,
            skipDuplicates: true,
        })
    }

    imported = leadsToCreate.length

    return {
        success: true,
        imported,
        duplicates,
        errors,
        errorDetails: errorDetails.slice(0, 50),
    }
}
