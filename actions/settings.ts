// actions/settings.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

const profileUpdateSchema = z.object({
    name: z.string().trim().max(120).optional(),
    language: z.string().trim().min(2).max(20).default("pt-BR"),
    timezone: z.string().trim().min(1).max(100).default("America/Sao_Paulo"),
})

// ==================== PERFIL ====================

export async function getUserProfile() {
    try {
        const authUser = await requireAuth()

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
        const validated = profileUpdateSchema.safeParse(data)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0]?.message ?? "Dados invÃ¡lidos" }
        }

        const authUser = await requireAuth()

        const user = await prisma.user.update({
            where: { id: authUser.id },
            data: {
                name: validated.data.name || null,
                language: validated.data.language,
                timezone: validated.data.timezone,
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

// ==================== ESTATÍSTICAS DA CONTA ====================

export async function getAccountStats() {
    try {
        const user = await requireAuth()

        // Buscar workspaces do usuário
        const workspaces = await prisma.workspace.findMany({
            where: { userId: user.id },
            select: { id: true },
        })

        const workspaceIds = workspaces.map((w) => w.id)

        // Estatísticas do AgencyCRM
        const [leads, campaigns, templates, calls] = await Promise.all([
            prisma.lead.count({
                where: { workspaceId: { in: workspaceIds } },
            }),
            prisma.campaign.count({
                where: { workspaceId: { in: workspaceIds } },
            }),
            prisma.emailTemplate.count({
                where: { workspaceId: { in: workspaceIds } },
            }),
            prisma.call.count({
                where: { workspaceId: { in: workspaceIds } },
            }),
        ])

        return {
            success: true,
            data: { leads, campaigns, templates, calls },
        }
    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
        return { success: false, error: "Erro ao buscar estatísticas" }
    }
}
