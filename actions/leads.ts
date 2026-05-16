// actions/leads.ts

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
    createLeadSchema,
    updateLeadSchema,
    type CreateLeadData,
    type UpdateLeadData
} from '@/lib/validations/lead.validations'
import type { LeadStatus } from '@prisma/client'
import { LeadStatus as LeadStatusEnum } from '@prisma/client'
import { ActionResult, success, failure } from '@/lib/types/actions'
import {
    createServiceContext,
    createWorkspaceServiceContext,
} from '@/lib/auth/context'
import {
    getLeads as getLeadsService,
    getLeadById as getLeadByIdService,
    getLeadEmailSends as getLeadEmailSendsService,
    createLead as createLeadService,
    updateLead as updateLeadService,
    deleteLead as deleteLeadService,
    deleteMultipleLeads as deleteMultipleLeadsService,
    importLeads as importLeadsService,
    type LeadWithRelations,
    type LeadStats,
    type GetLeadsParams,
    type ImportLeadData,
    type ImportResult,
} from '@/lib/services/leads.service'

// ============================================================
// SCHEMAS
// ============================================================

const idSchema = z.string().min(1).max(200)
const idListSchema = z.array(idSchema).min(1).max(500)
const getLeadsParamsSchema = z.object({
    workspaceId: z.string().min(1),
    search: z.string().trim().max(120).optional(),
    status: z.nativeEnum(LeadStatusEnum).optional(),
    country: z.string().trim().max(2).transform((value) => value.toUpperCase()).optional(),
    industry: z.string().trim().max(100).optional(),
    page: z.number().int().min(1).max(10_000).default(1),
    pageSize: z.number().int().min(1).max(100).default(50),
})

function getFirstZodError(error: { issues: Array<{ message: string }> }): string {
    return error.issues[0]?.message ?? 'Dados inválidos'
}

// ============================================================
// QUERIES
// ============================================================

export async function getLeads(params: GetLeadsParams): Promise<ActionResult<{
    leads: LeadWithRelations[]
    total: number
    stats: LeadStats
}>> {
    const parsedParams = getLeadsParamsSchema.safeParse(params)
    if (!parsedParams.success) {
        return failure(getFirstZodError(parsedParams.error))
    }

    const auth = await createWorkspaceServiceContext(parsedParams.data.workspaceId)
    if (!auth.ok) {
        return failure(auth.error)
    }

    try {
        const data = await getLeadsService(auth.ctx.prisma, parsedParams.data)
        return success(data)
    } catch (error) {
        console.error('Erro ao buscar leads:', error)
        return failure('Erro ao buscar leads')
    }
}

export async function getLeadById(id: string): Promise<ActionResult<LeadWithRelations>> {
    const parsedId = idSchema.safeParse(id)
    if (!parsedId.success) {
        return failure('Lead inválido')
    }

    const auth = await createServiceContext()
    if (!auth.ok) {
        return failure(auth.error)
    }

    try {
        const lead = await getLeadByIdService(auth.ctx.prisma, auth.ctx, parsedId.data)
        if (!lead) {
            return failure('Lead não encontrado')
        }
        return success(lead)
    } catch (error) {
        console.error('Erro ao buscar lead:', error)
        return failure('Erro ao buscar lead')
    }
}

export async function getLeadEmailSends(leadId: string): Promise<{
    id: string
    campaignName: string
    status: string
    sentAt: string | null
    openedAt: string | null
    clickedAt: string | null
}[]> {
    const auth = await createServiceContext()
    if (!auth.ok) {
        return []
    }

    return getLeadEmailSendsService(auth.ctx.prisma, auth.ctx, leadId)
}

// ============================================================
// MUTATIONS
// ============================================================

export async function createLead(data: CreateLeadData): Promise<ActionResult<LeadWithRelations>> {
    const validation = createLeadSchema.safeParse(data)
    if (!validation.success) {
        return failure(getFirstZodError(validation.error))
    }

    const auth = await createWorkspaceServiceContext(validation.data.workspaceId)
    if (!auth.ok) {
        return failure(auth.error)
    }

    try {
        const lead = await createLeadService(auth.ctx.prisma, validation.data)
        revalidatePath('/leads')
        return success(lead)
    } catch (error) {
        if (error instanceof Error && error.message === 'DUPLICATE_EMAIL') {
            return failure('Já existe um lead com este email')
        }
        console.error('Erro ao criar lead:', error)
        return failure('Erro ao criar lead')
    }
}

export async function updateLead(
    id: string,
    data: UpdateLeadData
): Promise<ActionResult<LeadWithRelations>> {
    const validation = updateLeadSchema.safeParse(data)
    if (!validation.success) {
        return failure(getFirstZodError(validation.error))
    }

    const auth = await createServiceContext()
    if (!auth.ok) {
        return failure(auth.error)
    }

    try {
        const lead = await updateLeadService(auth.ctx.prisma, auth.ctx, id, validation.data)
        revalidatePath('/leads')
        revalidatePath(`/leads/${id}`)
        return success(lead)
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'LEAD_NOT_FOUND') {
                return failure('Lead não encontrado')
            }
            if (error.message === 'DUPLICATE_EMAIL') {
                return failure('Já existe um lead com este email')
            }
        }
        console.error('Erro ao atualizar lead:', error)
        return failure('Erro ao atualizar lead')
    }
}

export async function deleteLead(id: string): Promise<ActionResult> {
    const parsedId = idSchema.safeParse(id)
    if (!parsedId.success) {
        return failure('Lead inválido')
    }

    const auth = await createServiceContext()
    if (!auth.ok) {
        return failure(auth.error)
    }

    try {
        await deleteLeadService(auth.ctx.prisma, auth.ctx, parsedId.data)
        revalidatePath('/leads')
        return success(undefined)
    } catch (error) {
        if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
            return failure('Lead não encontrado')
        }
        console.error('Erro ao excluir lead:', error)
        return failure('Erro ao excluir lead')
    }
}

export async function updateLeadStatus(
    id: string,
    status: LeadStatus
): Promise<ActionResult<LeadWithRelations>> {
    const parsedStatus = z.nativeEnum(LeadStatusEnum).safeParse(status)
    if (!parsedStatus.success) {
        return failure('Status inválido')
    }

    return updateLead(id, { status })
}

export async function deleteMultipleLeads(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
    const parsedIds = idListSchema.safeParse(ids)
    if (!parsedIds.success) {
        return failure(getFirstZodError(parsedIds.error))
    }

    const auth = await createServiceContext()
    if (!auth.ok) {
        return failure(auth.error)
    }

    try {
        const count = await deleteMultipleLeadsService(auth.ctx.prisma, auth.ctx, parsedIds.data)
        revalidatePath('/leads')
        return success({ deleted: count })
    } catch (error) {
        console.error('Erro ao excluir leads:', error)
        return failure('Erro ao excluir leads')
    }
}

export async function importLeads(
    workspaceId: string,
    leads: ImportLeadData[]
): Promise<ActionResult<ImportResult>> {
    const auth = await createWorkspaceServiceContext(workspaceId)
    if (!auth.ok) {
        return failure(auth.error)
    }

    try {
        const result = await importLeadsService(auth.ctx.prisma, workspaceId, leads)
        revalidatePath('/leads')
        return success(result)
    } catch (error) {
        console.error('Erro ao importar leads:', error)
        return failure('Erro ao importar leads')
    }
}
