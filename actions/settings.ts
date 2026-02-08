// actions/settings.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

// ==================== HELPERS ====================

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error("Não autenticado")
    }

    return user
}

// ==================== PERFIL ====================

export async function getUserProfile() {
    try {
        const authUser = await getAuthenticatedUser()

        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                language: true,
                timezone: true,
                createdAt: true,
            },
        })

        if (!user) {
            return { success: false, error: "Usuário não encontrado" }
        }

        return {
            success: true,
            data: {
                ...user,
                createdAt: user.createdAt.toISOString(),
            },
        }
    } catch (error) {
        console.error("Erro ao buscar perfil:", error)
        return { success: false, error: "Erro ao buscar perfil" }
    }
}

export async function updateUserProfile(data: {
    name?: string
    language?: string
    timezone?: string
}) {
    try {
        const authUser = await getAuthenticatedUser()

        const user = await prisma.user.update({
            where: { id: authUser.id },
            data: {
                name: data.name?.trim() || null,
                language: data.language || "pt-BR",
                timezone: data.timezone || "America/Sao_Paulo",
            },
        })

        revalidatePath("/settings")
        revalidatePath("/dashboard")

        return { success: true, data: user }
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error)
        return { success: false, error: "Erro ao atualizar perfil" }
    }
}

// ==================== PIPELINE STAGES ====================

export async function getPipelineStagesForSettings() {
    try {
        await getAuthenticatedUser()

        const stages = await prisma.pipelineStage.findMany({
            orderBy: { order: "asc" },
            include: {
                _count: {
                    select: { deals: true },
                },
            },
        })

        return {
            success: true,
            data: stages.map((stage) => ({
                ...stage,
                createdAt: stage.createdAt.toISOString(),
                updatedAt: stage.updatedAt.toISOString(),
                dealsCount: stage._count.deals,
            })),
        }
    } catch (error) {
        console.error("Erro ao buscar estágios:", error)
        return { success: false, error: "Erro ao buscar estágios" }
    }
}

export async function createPipelineStage(data: {
    name: string
    color: string
}) {
    try {
        await getAuthenticatedUser()

        // Buscar a maior ordem atual
        const lastStage = await prisma.pipelineStage.findFirst({
            orderBy: { order: "desc" },
        })

        const newOrder = (lastStage?.order ?? 0) + 1

        const stage = await prisma.pipelineStage.create({
            data: {
                name: data.name.trim(),
                color: data.color,
                order: newOrder,
                isActive: true,
            },
        })

        revalidatePath("/settings")
        revalidatePath("/deals")

        return { success: true, data: stage }
    } catch (error) {
        console.error("Erro ao criar estágio:", error)
        return { success: false, error: "Erro ao criar estágio" }
    }
}

export async function updatePipelineStage(
    id: string,
    data: {
        name?: string
        color?: string
        isActive?: boolean
    }
) {
    try {
        await getAuthenticatedUser()

        const stage = await prisma.pipelineStage.update({
            where: { id },
            data: {
                name: data.name?.trim(),
                color: data.color,
                isActive: data.isActive,
            },
        })

        revalidatePath("/settings")
        revalidatePath("/deals")

        return { success: true, data: stage }
    } catch (error) {
        console.error("Erro ao atualizar estágio:", error)
        return { success: false, error: "Erro ao atualizar estágio" }
    }
}

export async function deletePipelineStage(id: string) {
    try {
        await getAuthenticatedUser()

        // Verificar se há deals neste estágio
        const dealsCount = await prisma.deal.count({
            where: { stageId: id },
        })

        if (dealsCount > 0) {
            return {
                success: false,
                error: `Não é possível excluir: existem ${dealsCount} deal(s) neste estágio. Mova-os primeiro.`,
            }
        }

        await prisma.pipelineStage.delete({
            where: { id },
        })

        revalidatePath("/settings")
        revalidatePath("/deals")

        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir estágio:", error)
        return { success: false, error: "Erro ao excluir estágio" }
    }
}

export async function reorderPipelineStages(orderedIds: string[]) {
    try {
        await getAuthenticatedUser()

        // Atualizar a ordem de cada estágio
        const updates = orderedIds.map((id, index) =>
            prisma.pipelineStage.update({
                where: { id },
                data: { order: index + 1 },
            })
        )

        await prisma.$transaction(updates)

        revalidatePath("/settings")
        revalidatePath("/deals")

        return { success: true }
    } catch (error) {
        console.error("Erro ao reordenar estágios:", error)
        return { success: false, error: "Erro ao reordenar estágios" }
    }
}

// ==================== ESTATÍSTICAS DA CONTA ====================

export async function getAccountStats() {
    try {
        const user = await getAuthenticatedUser()

        const [contacts, companies, deals, tasks] = await Promise.all([
            prisma.contact.count({
                where: {
                    OR: [
                        { createdById: user.id },
                        { assignedToId: user.id },
                    ],
                },
            }),
            prisma.company.count({
                where: { assignedToId: user.id },
            }),
            prisma.deal.count({
                where: { assignedToId: user.id },
            }),
            prisma.task.count({
                where: { createdById: user.id },
            }),
        ])

        return {
            success: true,
            data: { contacts, companies, deals, tasks },
        }
    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
        return { success: false, error: "Erro ao buscar estatísticas" }
    }
}