// actions/workspaces.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

type SerializableWorkspace = {
    createdAt: Date | string
    updatedAt: Date | string
}

// Tipos
export type WorkspaceFormData = {
    name: string
    description?: string | null
    color?: string
    logo?: string | null
    senderName?: string | null
    senderEmail?: string | null
}

const idSchema = z.string().min(1).max(200)
const workspaceFormSchema = z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000).optional().nullable().transform((value) => value || null),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#3B82F6"),
    logo: z.string().url().max(2048).optional().nullable().transform((value) => value || null),
    senderName: z.string().trim().max(120).optional().nullable().transform((value) => value || null),
    senderEmail: z.string().email().max(255).optional().nullable().transform((value) => value || null),
})

// Função para serializar workspace
function serializeWorkspace<T extends SerializableWorkspace>(
    workspace: T
): Omit<T, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string }
function serializeWorkspace(workspace: null): null
function serializeWorkspace<T extends SerializableWorkspace>(
    workspace: T | null
): (Omit<T, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string }) | null {
    if (!workspace) return null
    return {
        ...workspace,
        createdAt: workspace.createdAt instanceof Date
            ? workspace.createdAt.toISOString()
            : workspace.createdAt,
        updatedAt: workspace.updatedAt instanceof Date
            ? workspace.updatedAt.toISOString()
            : workspace.updatedAt,
    }
}

// Obter usuário autenticado E garantir que existe na tabela users
async function getAuthenticatedUser() {
    return requireAuth()
}

// CREATE - Criar workspace
export async function createWorkspace(data: WorkspaceFormData) {
    try {
        const validated = workspaceFormSchema.safeParse(data)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0]?.message ?? "Dados invÃ¡lidos" }
        }

        const user = await getAuthenticatedUser()

        const workspace = await prisma.workspace.create({
            data: {
                ...validated.data,
                userId: user.id,
            },
        })

        revalidatePath("/workspaces")
        return { success: true, data: serializeWorkspace(workspace) }
    } catch (error) {
        console.error("Erro ao criar workspace:", error)
        return { success: false, error: "Erro ao criar workspace" }
    }
}

// READ - Listar workspaces do usuário
export async function getWorkspaces() {
    try {
        const user = await getAuthenticatedUser()

        const workspaces = await prisma.workspace.findMany({
            where: { userId: user.id },
            include: {
                _count: {
                    select: {
                        leads: true,
                        campaigns: true,
                        calls: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        })

        const serialized = workspaces.map((w) => ({
            ...serializeWorkspace(w),
            _count: w._count,
        }))

        return { success: true, data: serialized }
    } catch (error) {
        console.error("Erro ao buscar workspaces:", error)
        return { success: false, error: "Erro ao buscar workspaces", data: [] }
    }
}

// READ - Buscar workspace por ID
export async function getWorkspaceById(id: string) {
    try {
        const parsedId = idSchema.safeParse(id)
        if (!parsedId.success) {
            return { success: false, error: "Workspace invÃ¡lido" }
        }

        const user = await getAuthenticatedUser()

        const workspace = await prisma.workspace.findFirst({
            where: {
                id: parsedId.data,
                userId: user.id,
            },
            include: {
                _count: {
                    select: {
                        leads: true,
                        campaigns: true,
                        emailTemplates: true,
                        calls: true,
                        tags: true,
                    },
                },
            },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        return {
            success: true,
            data: {
                ...serializeWorkspace(workspace),
                _count: workspace._count,
            }
        }
    } catch (error) {
        console.error("Erro ao buscar workspace:", error)
        return { success: false, error: "Erro ao buscar workspace" }
    }
}

// UPDATE - Atualizar workspace
export async function updateWorkspace(id: string, data: WorkspaceFormData) {
    try {
        const parsedId = idSchema.safeParse(id)
        const validated = workspaceFormSchema.safeParse(data)
        if (!parsedId.success || !validated.success) {
            return { success: false, error: validated.error?.issues[0]?.message ?? "Dados invÃ¡lidos" }
        }

        const user = await getAuthenticatedUser()

        // Verificar se pertence ao usuário
        const existing = await prisma.workspace.findFirst({
            where: { id: parsedId.data, userId: user.id },
        })

        if (!existing) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const workspace = await prisma.workspace.update({
            where: { id: parsedId.data },
            data: validated.data,
        })

        revalidatePath("/workspaces")
        revalidatePath(`/workspaces/${parsedId.data}`)
        return { success: true, data: serializeWorkspace(workspace) }
    } catch (error) {
        console.error("Erro ao atualizar workspace:", error)
        return { success: false, error: "Erro ao atualizar workspace" }
    }
}

// DELETE - Excluir workspace
export async function deleteWorkspace(id: string) {
    try {
        const parsedId = idSchema.safeParse(id)
        if (!parsedId.success) {
            return { success: false, error: "Workspace invÃ¡lido" }
        }

        const user = await getAuthenticatedUser()

        // Verificar se pertence ao usuário
        const existing = await prisma.workspace.findFirst({
            where: { id: parsedId.data, userId: user.id },
            include: {
                _count: {
                    select: {
                        leads: true,
                        campaigns: true,
                    },
                },
            },
        })

        if (!existing) {
            return { success: false, error: "Workspace não encontrado" }
        }

        // Avisar se tem dados
        if (existing._count.leads > 0 || existing._count.campaigns > 0) {
            console.log(`Excluindo workspace ${parsedId.data} com ${existing._count.leads} leads e ${existing._count.campaigns} campanhas`)
        }

        await prisma.workspace.delete({
            where: { id: parsedId.data },
        })

        revalidatePath("/workspaces")
        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir workspace:", error)
        return { success: false, error: "Erro ao excluir workspace" }
    }
}

// Estatísticas do workspace
export async function getWorkspaceStats(workspaceId: string) {
    try {
        const parsedWorkspaceId = idSchema.safeParse(workspaceId)
        if (!parsedWorkspaceId.success) {
            return { success: false, error: "Workspace invÃ¡lido" }
        }

        const user = await getAuthenticatedUser()

        // Verificar se pertence ao usuário
        const workspace = await prisma.workspace.findFirst({
            where: { id: parsedWorkspaceId.data, userId: user.id },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        // Buscar estatísticas
        const [
            totalLeads,
            leadsByStatus,
            totalCampaigns,
            totalEmailsSent,
            totalCalls,
        ] = await Promise.all([
            prisma.lead.count({ where: { workspaceId: parsedWorkspaceId.data } }),
            prisma.lead.groupBy({
                by: ["status"],
                where: { workspaceId: parsedWorkspaceId.data },
                _count: true,
            }),
            prisma.campaign.count({ where: { workspaceId: parsedWorkspaceId.data } }),
            prisma.emailSend.count({
                where: { campaign: { workspaceId: parsedWorkspaceId.data } },
            }),
            prisma.call.count({ where: { workspaceId: parsedWorkspaceId.data } }),
        ])

        return {
            success: true,
            data: {
                totalLeads,
                leadsByStatus,
                totalCampaigns,
                totalEmailsSent,
                totalCalls,
            },
        }
    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
        return { success: false, error: "Erro ao buscar estatísticas" }
    }
}
