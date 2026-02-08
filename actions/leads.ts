// actions/leads.ts

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'
import {
    createLeadSchema,
    updateLeadSchema,
    type CreateLeadData,
    type UpdateLeadData
} from '@/lib/validations/lead.validations'
import { sanitizeLeadData } from '@/lib/utils/lead.utils'
import type { LeadStatus, CompanySize } from '@prisma/client'

// ============================================================
// TIPOS
// ============================================================

interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

interface GetLeadsParams {
    workspaceId: string
    search?: string
    status?: LeadStatus
    country?: string
    industry?: string
    page?: number
    pageSize?: number
}

interface LeadWithRelations {
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
    createdAt: Date
    updatedAt: Date
}

interface LeadStats {
    total: number
    new: number
    interested: number
    converted: number
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
// HELPERS
// ============================================================

function getFirstZodError(error: { issues: Array<{ message: string }> }): string {
    return error.issues[0]?.message ?? 'Dados inválidos'
}

function isValidCompanySize(value: string | null | undefined): boolean {
    if (!value) return false
    const validSizes = ['MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']
    return validSizes.includes(value.toUpperCase())
}

function generateImportBatchId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// ============================================================
// QUERIES
// ============================================================

export async function getLeads(params: GetLeadsParams): Promise<ActionResult<{
    leads: LeadWithRelations[]
    total: number
    stats: LeadStats
}>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const {
            workspaceId,
            search,
            status,
            country,
            industry,
            page = 1,
            pageSize = 50
        } = params

        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId: user.id }
        })

        if (!workspace) {
            return { success: false, error: 'Workspace não encontrado' }
        }

        const where = {
            workspaceId,
            ...(status && { status }),
            ...(country && { country }),
            ...(industry && { industry }),
            ...(search && {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' as const } },
                    { lastName: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                    { company: { contains: search, mode: 'insensitive' as const } },
                ]
            })
        }

        const [leads, total, stats] = await Promise.all([
            prisma.lead.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    _count: {
                        select: {
                            emailSends: true,
                            calls: true,
                        }
                    }
                }
            }),
            prisma.lead.count({ where }),
            getLeadStats(workspaceId),
        ])

        return {
            success: true,
            data: {
                leads: leads as unknown as LeadWithRelations[],
                total,
                stats
            }
        }
    } catch (error) {
        console.error('Erro ao buscar leads:', error)
        return { success: false, error: 'Erro ao buscar leads' }
    }
}

export async function getLeadById(id: string): Promise<ActionResult<LeadWithRelations>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const lead = await prisma.lead.findFirst({
            where: {
                id,
                workspace: { userId: user.id }
            }
        })

        if (!lead) {
            return { success: false, error: 'Lead não encontrado' }
        }

        return { success: true, data: lead as unknown as LeadWithRelations }
    } catch (error) {
        console.error('Erro ao buscar lead:', error)
        return { success: false, error: 'Erro ao buscar lead' }
    }
}

async function getLeadStats(workspaceId: string): Promise<LeadStats> {
    const [total, newCount, interested, converted] = await Promise.all([
        prisma.lead.count({ where: { workspaceId } }),
        prisma.lead.count({ where: { workspaceId, status: 'NEW' } }),
        prisma.lead.count({ where: { workspaceId, status: 'INTERESTED' } }),
        prisma.lead.count({ where: { workspaceId, status: 'CONVERTED' } }),
    ])

    return { total, new: newCount, interested, converted }
}

// ============================================================
// MUTATIONS
// ============================================================

export async function createLead(data: CreateLeadData): Promise<ActionResult<LeadWithRelations>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const validation = createLeadSchema.safeParse(data)
        if (!validation.success) {
            return { success: false, error: getFirstZodError(validation.error) }
        }

        const workspace = await prisma.workspace.findFirst({
            where: { id: data.workspaceId, userId: user.id }
        })

        if (!workspace) {
            return { success: false, error: 'Workspace não encontrado' }
        }

        const existingLead = await prisma.lead.findUnique({
            where: {
                email_workspaceId: {
                    email: data.email,
                    workspaceId: data.workspaceId
                }
            }
        })

        if (existingLead) {
            return { success: false, error: 'Já existe um lead com este email' }
        }

        const sanitizedData = sanitizeLeadData(validation.data)

        const lead = await prisma.lead.create({
            data: sanitizedData as Parameters<typeof prisma.lead.create>[0]['data']
        })

        revalidatePath('/leads')

        return { success: true, data: lead as unknown as LeadWithRelations }
    } catch (error) {
        console.error('Erro ao criar lead:', error)
        return { success: false, error: 'Erro ao criar lead' }
    }
}

export async function updateLead(
    id: string,
    data: UpdateLeadData
): Promise<ActionResult<LeadWithRelations>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const validation = updateLeadSchema.safeParse(data)
        if (!validation.success) {
            return { success: false, error: getFirstZodError(validation.error) }
        }

        const existingLead = await prisma.lead.findFirst({
            where: {
                id,
                workspace: { userId: user.id }
            }
        })

        if (!existingLead) {
            return { success: false, error: 'Lead não encontrado' }
        }

        if (data.email && data.email !== existingLead.email) {
            const duplicateEmail = await prisma.lead.findFirst({
                where: {
                    email: data.email,
                    workspaceId: existingLead.workspaceId,
                    NOT: { id }
                }
            })

            if (duplicateEmail) {
                return { success: false, error: 'Já existe um lead com este email' }
            }
        }

        const sanitizedData = sanitizeLeadData(validation.data)

        const lead = await prisma.lead.update({
            where: { id },
            data: sanitizedData as Parameters<typeof prisma.lead.update>[0]['data']
        })

        revalidatePath('/leads')
        revalidatePath(`/leads/${id}`)

        return { success: true, data: lead as unknown as LeadWithRelations }
    } catch (error) {
        console.error('Erro ao atualizar lead:', error)
        return { success: false, error: 'Erro ao atualizar lead' }
    }
}

export async function deleteLead(id: string): Promise<ActionResult> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const lead = await prisma.lead.findFirst({
            where: {
                id,
                workspace: { userId: user.id }
            }
        })

        if (!lead) {
            return { success: false, error: 'Lead não encontrado' }
        }

        await prisma.lead.delete({ where: { id } })

        revalidatePath('/leads')

        return { success: true }
    } catch (error) {
        console.error('Erro ao excluir lead:', error)
        return { success: false, error: 'Erro ao excluir lead' }
    }
}

export async function updateLeadStatus(
    id: string,
    status: LeadStatus
): Promise<ActionResult<LeadWithRelations>> {
    return updateLead(id, { status })
}

export async function deleteMultipleLeads(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        if (ids.length === 0) {
            return { success: false, error: 'Nenhum lead selecionado' }
        }

        const result = await prisma.lead.deleteMany({
            where: {
                id: { in: ids },
                workspace: { userId: user.id }
            }
        })

        revalidatePath('/leads')

        return { success: true, data: { deleted: result.count } }
    } catch (error) {
        console.error('Erro ao excluir leads:', error)
        return { success: false, error: 'Erro ao excluir leads' }
    }
}

// ============================================================
// IMPORTAÇÃO EM LOTE
// ============================================================

export async function importLeads(
    workspaceId: string,
    leads: ImportLeadData[]
): Promise<ActionResult<ImportResult>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId: user.id }
        })

        if (!workspace) {
            return { success: false, error: 'Workspace não encontrado' }
        }

        const importBatch = generateImportBatchId()
        const importedAt = new Date()

        let imported = 0
        let duplicates = 0
        let errors = 0
        const errorDetails: ImportResult['errorDetails'] = []

        const existingEmails = await prisma.lead.findMany({
            where: { workspaceId },
            select: { email: true }
        })
        const existingEmailSet = new Set(existingEmails.map(e => e.email.toLowerCase()))

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
            status: 'NEW'
            source: 'IMPORT'
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
                    email: lead.email || '(vazio)',
                    reason: 'Email é obrigatório'
                })
                return
            }

            if (!lead.firstName?.trim()) {
                errors++
                errorDetails.push({
                    row: index + 1,
                    email,
                    reason: 'Nome é obrigatório'
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
                status: 'NEW',
                source: 'IMPORT',
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

        revalidatePath('/leads')

        return {
            success: true,
            data: {
                success: true,
                imported,
                duplicates,
                errors,
                errorDetails: errorDetails.slice(0, 50),
            }
        }
    } catch (error) {
        console.error('Erro ao importar leads:', error)
        return { success: false, error: 'Erro ao importar leads' }
    }
}