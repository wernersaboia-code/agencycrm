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
import type { LeadStatus } from '@prisma/client'

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
    companySize: string | null
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

// ============================================================
// HELPERS
// ============================================================

/**
 * Extrai a primeira mensagem de erro do Zod
 */
function getFirstZodError(error: { issues: Array<{ message: string }> }): string {
    return error.issues[0]?.message ?? 'Dados inválidos'
}

// ============================================================
// QUERIES
// ============================================================

/**
 * Busca leads do workspace com filtros e paginação
 */
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

        // Verifica se o workspace pertence ao usuário
        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId: user.id }
        })

        if (!workspace) {
            return { success: false, error: 'Workspace não encontrado' }
        }

        // Monta os filtros
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

        // Busca leads com paginação
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

/**
 * Busca um lead específico por ID
 */
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

/**
 * Retorna estatísticas dos leads do workspace
 */
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

/**
 * Cria um novo lead
 */
export async function createLead(data: CreateLeadData): Promise<ActionResult<LeadWithRelations>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        // Valida os dados
        const validation = createLeadSchema.safeParse(data)
        if (!validation.success) {
            return { success: false, error: getFirstZodError(validation.error) }
        }

        // Verifica se o workspace pertence ao usuário
        const workspace = await prisma.workspace.findFirst({
            where: { id: data.workspaceId, userId: user.id }
        })

        if (!workspace) {
            return { success: false, error: 'Workspace não encontrado' }
        }

        // Verifica se já existe lead com este email no workspace
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

        // Sanitiza os dados (converte strings vazias para null)
        const sanitizedData = sanitizeLeadData(validation.data)

        // Cria o lead
        const lead = await prisma.lead.create({
            data: sanitizedData as any
        })

        revalidatePath('/leads')

        return { success: true, data: lead as unknown as LeadWithRelations }
    } catch (error) {
        console.error('Erro ao criar lead:', error)
        return { success: false, error: 'Erro ao criar lead' }
    }
}

/**
 * Atualiza um lead existente
 */
export async function updateLead(
    id: string,
    data: UpdateLeadData
): Promise<ActionResult<LeadWithRelations>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        // Valida os dados
        const validation = updateLeadSchema.safeParse(data)
        if (!validation.success) {
            return { success: false, error: getFirstZodError(validation.error) }
        }

        // Verifica se o lead existe e pertence ao usuário
        const existingLead = await prisma.lead.findFirst({
            where: {
                id,
                workspace: { userId: user.id }
            }
        })

        if (!existingLead) {
            return { success: false, error: 'Lead não encontrado' }
        }

        // Se está alterando o email, verifica duplicidade
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

        // Sanitiza os dados
        const sanitizedData = sanitizeLeadData(validation.data)

        // Atualiza o lead
        const lead = await prisma.lead.update({
            where: { id },
            data: sanitizedData as any
        })

        revalidatePath('/leads')
        revalidatePath(`/leads/${id}`)

        return { success: true, data: lead as unknown as LeadWithRelations }
    } catch (error) {
        console.error('Erro ao atualizar lead:', error)
        return { success: false, error: 'Erro ao atualizar lead' }
    }
}

/**
 * Exclui um lead
 */
export async function deleteLead(id: string): Promise<ActionResult> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        // Verifica se o lead existe e pertence ao usuário
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                workspace: { userId: user.id }
            }
        })

        if (!lead) {
            return { success: false, error: 'Lead não encontrado' }
        }

        // Exclui o lead
        await prisma.lead.delete({ where: { id } })

        revalidatePath('/leads')

        return { success: true }
    } catch (error) {
        console.error('Erro ao excluir lead:', error)
        return { success: false, error: 'Erro ao excluir lead' }
    }
}

/**
 * Atualiza o status de um lead
 */
export async function updateLeadStatus(
    id: string,
    status: LeadStatus
): Promise<ActionResult<LeadWithRelations>> {
    return updateLead(id, { status })
}

/**
 * Exclui múltiplos leads
 */
export async function deleteMultipleLeads(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: 'Não autenticado' }
        }

        if (ids.length === 0) {
            return { success: false, error: 'Nenhum lead selecionado' }
        }

        // Exclui apenas leads que pertencem ao usuário
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