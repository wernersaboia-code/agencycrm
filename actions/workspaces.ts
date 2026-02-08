// actions/workspaces.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

// Tipos
export type WorkspaceFormData = {
    name: string
    description?: string | null
    color?: string
    logo?: string | null
    senderName?: string | null
    senderEmail?: string | null
}

// Função para serializar workspace
function serializeWorkspace(workspace: any) {
    if (!workspace) return null
    return {
        ...workspace,
        createdAt: workspace.createdAt?.toISOString?.() || workspace.createdAt,
        updatedAt: workspace.updatedAt?.toISOString?.() || workspace.updatedAt,
    }
}

// Obter usuário autenticado E garantir que existe na tabela users
async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error("Usuário não autenticado")
    }

    // Verificar se o usuário existe na tabela users
    let dbUser = await prisma.user.findUnique({
        where: { id: user.id },
    })

    // Se não existe, criar
    if (!dbUser) {
        dbUser = await prisma.user.create({
            data: {
                id: user.id, // Usar o mesmo ID do Supabase Auth
                email: user.email!,
                name: user.user_metadata?.name || user.email?.split("@")[0] || "Usuário",
            },
        })
        console.log("Usuário criado na tabela users:", dbUser.id)
    }

    return dbUser
}

// CREATE - Criar workspace
export async function createWorkspace(data: WorkspaceFormData) {
    try {
        const user = await getAuthenticatedUser()

        const workspace = await prisma.workspace.create({
            data: {
                name: data.name.trim(),
                description: data.description?.trim() || null,
                color: data.color || "#3B82F6",
                logo: data.logo || null,
                senderName: data.senderName?.trim() || null,
                senderEmail: data.senderEmail?.trim() || null,
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
        const user = await getAuthenticatedUser()

        const workspace = await prisma.workspace.findFirst({
            where: {
                id,
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
        const user = await getAuthenticatedUser()

        // Verificar se pertence ao usuário
        const existing = await prisma.workspace.findFirst({
            where: { id, userId: user.id },
        })

        if (!existing) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const workspace = await prisma.workspace.update({
            where: { id },
            data: {
                name: data.name.trim(),
                description: data.description?.trim() || null,
                color: data.color || "#3B82F6",
                logo: data.logo || null,
                senderName: data.senderName?.trim() || null,
                senderEmail: data.senderEmail?.trim() || null,
            },
        })

        revalidatePath("/workspaces")
        revalidatePath(`/workspaces/${id}`)
        return { success: true, data: serializeWorkspace(workspace) }
    } catch (error) {
        console.error("Erro ao atualizar workspace:", error)
        return { success: false, error: "Erro ao atualizar workspace" }
    }
}

// DELETE - Excluir workspace
export async function deleteWorkspace(id: string) {
    try {
        const user = await getAuthenticatedUser()

        // Verificar se pertence ao usuário
        const existing = await prisma.workspace.findFirst({
            where: { id, userId: user.id },
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
            console.log(`Excluindo workspace ${id} com ${existing._count.leads} leads e ${existing._count.campaigns} campanhas`)
        }

        await prisma.workspace.delete({
            where: { id },
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
        const user = await getAuthenticatedUser()

        // Verificar se pertence ao usuário
        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId: user.id },
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
            prisma.lead.count({ where: { workspaceId } }),
            prisma.lead.groupBy({
                by: ["status"],
                where: { workspaceId },
                _count: true,
            }),
            prisma.campaign.count({ where: { workspaceId } }),
            prisma.emailSend.count({
                where: { campaign: { workspaceId } },
            }),
            prisma.call.count({ where: { workspaceId } }),
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