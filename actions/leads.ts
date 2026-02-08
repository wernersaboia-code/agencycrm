// actions/leads.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { LeadStatus } from "@prisma/client"

// Tipos
export type LeadFormData = {
    firstName: string
    lastName?: string | null
    email: string
    phone?: string | null
    mobile?: string | null
    company?: string | null
    jobTitle?: string | null
    website?: string | null
    status?: LeadStatus
    source?: string | null
    notes?: string | null
}

// Função para serializar lead
function serializeLead(lead: any) {
    if (!lead) return null
    return {
        ...lead,
        createdAt: lead.createdAt?.toISOString?.() || lead.createdAt,
        updatedAt: lead.updatedAt?.toISOString?.() || lead.updatedAt,
        importedAt: lead.importedAt?.toISOString?.() || lead.importedAt,
    }
}

// Obter usuário autenticado e garantir que existe na tabela
async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error("Usuário não autenticado")
    }

    let dbUser = await prisma.user.findUnique({
        where: { id: user.id },
    })

    if (!dbUser) {
        dbUser = await prisma.user.create({
            data: {
                id: user.id,
                email: user.email!,
                name: user.user_metadata?.name || user.email?.split("@")[0] || "Usuário",
            },
        })
    }

    return dbUser
}

// Verificar se workspace pertence ao usuário
async function verifyWorkspaceAccess(workspaceId: string, userId: string) {
    const workspace = await prisma.workspace.findFirst({
        where: { id: workspaceId, userId },
    })

    if (!workspace) {
        throw new Error("Workspace não encontrado ou sem permissão")
    }

    return workspace
}

// CREATE - Criar lead
export async function createLead(workspaceId: string, data: LeadFormData) {
    try {
        const user = await getAuthenticatedUser()
        await verifyWorkspaceAccess(workspaceId, user.id)

        // Verificar se email já existe no workspace
        const existingLead = await prisma.lead.findFirst({
            where: {
                email: data.email.toLowerCase().trim(),
                workspaceId,
            },
        })

        if (existingLead) {
            return { success: false, error: "Já existe um lead com este email neste cliente" }
        }

        const lead = await prisma.lead.create({
            data: {
                firstName: data.firstName.trim(),
                lastName: data.lastName?.trim() || null,
                email: data.email.toLowerCase().trim(),
                phone: data.phone?.trim() || null,
                mobile: data.mobile?.trim() || null,
                company: data.company?.trim() || null,
                jobTitle: data.jobTitle?.trim() || null,
                website: data.website?.trim() || null,
                status: data.status || "NEW",
                source: data.source || "manual",
                notes: data.notes?.trim() || null,
                workspaceId,
            },
        })

        revalidatePath("/leads")
        return { success: true, data: serializeLead(lead) }
    } catch (error) {
        console.error("Erro ao criar lead:", error)
        return { success: false, error: "Erro ao criar lead" }
    }
}

// READ - Listar leads do workspace
export async function getLeads(
    workspaceId: string,
    options?: {
        search?: string
        status?: LeadStatus
        tagId?: string
        page?: number
        limit?: number
    }
) {
    try {
        const user = await getAuthenticatedUser()
        await verifyWorkspaceAccess(workspaceId, user.id)

        const { search, status, tagId, page = 1, limit = 50 } = options || {}

        const where: any = {
            workspaceId,
            ...(status && { status }),
            ...(search && {
                OR: [
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { company: { contains: search, mode: "insensitive" } },
                ],
            }),
            ...(tagId && {
                tags: {
                    some: { tagId },
                },
            }),
        }

        const [leads, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                include: {
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                    _count: {
                        select: {
                            emailSends: true,
                            calls: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.lead.count({ where }),
        ])

        const serialized = leads.map((lead) => ({
            ...serializeLead(lead),
            tags: lead.tags.map((t) => t.tag),
            _count: lead._count,
        }))

        return {
            success: true,
            data: serialized,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        }
    } catch (error) {
        console.error("Erro ao buscar leads:", error)
        return { success: false, error: "Erro ao buscar leads", data: [] }
    }
}

// READ - Buscar lead por ID
export async function getLeadById(workspaceId: string, leadId: string) {
    try {
        const user = await getAuthenticatedUser()
        await verifyWorkspaceAccess(workspaceId, user.id)

        const lead = await prisma.lead.findFirst({
            where: {
                id: leadId,
                workspaceId,
            },
            include: {
                tags: {
                    include: {
                        tag: true,
                    },
                },
                emailSends: {
                    include: {
                        campaign: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
                calls: {
                    orderBy: { calledAt: "desc" },
                    take: 10,
                },
            },
        })

        if (!lead) {
            return { success: false, error: "Lead não encontrado" }
        }

        return {
            success: true,
            data: {
                ...serializeLead(lead),
                tags: lead.tags.map((t) => t.tag),
                emailSends: lead.emailSends.map((e) => ({
                    ...e,
                    sentAt: e.sentAt?.toISOString() || null,
                    openedAt: e.openedAt?.toISOString() || null,
                    clickedAt: e.clickedAt?.toISOString() || null,
                    createdAt: e.createdAt.toISOString(),
                })),
                calls: lead.calls.map((c) => ({
                    ...c,
                    calledAt: c.calledAt.toISOString(),
                    followUpAt: c.followUpAt?.toISOString() || null,
                    createdAt: c.createdAt.toISOString(),
                    updatedAt: c.updatedAt.toISOString(),
                })),
            },
        }
    } catch (error) {
        console.error("Erro ao buscar lead:", error)
        return { success: false, error: "Erro ao buscar lead" }
    }
}

// UPDATE - Atualizar lead
export async function updateLead(
    workspaceId: string,
    leadId: string,
    data: LeadFormData
) {
    try {
        const user = await getAuthenticatedUser()
        await verifyWorkspaceAccess(workspaceId, user.id)

        // Verificar se lead existe
        const existing = await prisma.lead.findFirst({
            where: { id: leadId, workspaceId },
        })

        if (!existing) {
            return { success: false, error: "Lead não encontrado" }
        }

        // Verificar se novo email já existe (se mudou)
        if (data.email.toLowerCase().trim() !== existing.email) {
            const emailExists = await prisma.lead.findFirst({
                where: {
                    email: data.email.toLowerCase().trim(),
                    workspaceId,
                    NOT: { id: leadId },
                },
            })

            if (emailExists) {
                return { success: false, error: "Já existe um lead com este email" }
            }
        }

        const lead = await prisma.lead.update({
            where: { id: leadId },
            data: {
                firstName: data.firstName.trim(),
                lastName: data.lastName?.trim() || null,
                email: data.email.toLowerCase().trim(),
                phone: data.phone?.trim() || null,
                mobile: data.mobile?.trim() || null,
                company: data.company?.trim() || null,
                jobTitle: data.jobTitle?.trim() || null,
                website: data.website?.trim() || null,
                status: data.status,
                source: data.source || null,
                notes: data.notes?.trim() || null,
            },
        })

        revalidatePath("/leads")
        revalidatePath(`/leads/${leadId}`)
        return { success: true, data: serializeLead(lead) }
    } catch (error) {
        console.error("Erro ao atualizar lead:", error)
        return { success: false, error: "Erro ao atualizar lead" }
    }
}

// UPDATE - Atualizar apenas o status
export async function updateLeadStatus(
    workspaceId: string,
    leadId: string,
    status: LeadStatus
) {
    try {
        const user = await getAuthenticatedUser()
        await verifyWorkspaceAccess(workspaceId, user.id)

        const lead = await prisma.lead.update({
            where: { id: leadId },
            data: { status },
        })

        revalidatePath("/leads")
        return { success: true, data: serializeLead(lead) }
    } catch (error) {
        console.error("Erro ao atualizar status:", error)
        return { success: false, error: "Erro ao atualizar status" }
    }
}

// DELETE - Excluir lead
export async function deleteLead(workspaceId: string, leadId: string) {
    try {
        const user = await getAuthenticatedUser()
        await verifyWorkspaceAccess(workspaceId, user.id)

        const existing = await prisma.lead.findFirst({
            where: { id: leadId, workspaceId },
        })

        if (!existing) {
            return { success: false, error: "Lead não encontrado" }
        }

        await prisma.lead.delete({
            where: { id: leadId },
        })

        revalidatePath("/leads")
        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir lead:", error)
        return { success: false, error: "Erro ao excluir lead" }
    }
}

// Estatísticas de leads do workspace
export async function getLeadStats(workspaceId: string) {
    try {
        const user = await getAuthenticatedUser()
        await verifyWorkspaceAccess(workspaceId, user.id)

        const [total, byStatus] = await Promise.all([
            prisma.lead.count({ where: { workspaceId } }),
            prisma.lead.groupBy({
                by: ["status"],
                where: { workspaceId },
                _count: true,
            }),
        ])

        const statusCounts = byStatus.reduce(
            (acc, item) => {
                acc[item.status] = item._count
                return acc
            },
            {} as Record<string, number>
        )

        return {
            success: true,
            data: {
                total,
                byStatus: statusCounts,
                new: statusCounts["NEW"] || 0,
                contacted: statusCounts["CONTACTED"] || 0,
                interested: statusCounts["INTERESTED"] || 0,
                converted: statusCounts["CONVERTED"] || 0,
            },
        }
    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
        return { success: false, error: "Erro ao buscar estatísticas" }
    }
}