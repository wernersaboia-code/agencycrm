// actions/templates.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import {
    createTemplateSchema,
    updateTemplateSchema,
    type CreateTemplateData,
    type UpdateTemplateData
} from "@/lib/validations/template.validations"
import { TemplateCategory } from "@prisma/client"

// ============================================================
// TIPOS
// ============================================================

interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

export interface TemplateWithStats {
    id: string
    name: string
    subject: string
    body: string
    category: TemplateCategory
    isActive: boolean
    workspaceId: string
    createdAt: Date
    updatedAt: Date
    _count: {
        campaigns: number
    }
}

// ============================================================
// QUERIES
// ============================================================

export async function getTemplates(
    workspaceId: string,
    options?: {
        category?: TemplateCategory
        search?: string
        isActive?: boolean
    }
): Promise<ActionResult<TemplateWithStats[]>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        // Verificar se o workspace pertence ao usuário
        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId: user.id },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const where: any = { workspaceId }

        if (options?.category) {
            where.category = options.category
        }

        if (options?.isActive !== undefined) {
            where.isActive = options.isActive
        }

        if (options?.search) {
            where.OR = [
                { name: { contains: options.search, mode: "insensitive" } },
                { subject: { contains: options.search, mode: "insensitive" } },
            ]
        }

        const templates = await prisma.emailTemplate.findMany({
            where,
            include: {
                _count: {
                    select: { campaigns: true },
                },
            },
            orderBy: { updatedAt: "desc" },
        })

        return { success: true, data: templates }
    } catch (error) {
        console.error("Erro ao buscar templates:", error)
        return { success: false, error: "Erro ao buscar templates" }
    }
}

export async function getTemplateById(
    id: string
): Promise<ActionResult<TemplateWithStats>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const template = await prisma.emailTemplate.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
            include: {
                _count: {
                    select: { campaigns: true },
                },
            },
        })

        if (!template) {
            return { success: false, error: "Template não encontrado" }
        }

        return { success: true, data: template }
    } catch (error) {
        console.error("Erro ao buscar template:", error)
        return { success: false, error: "Erro ao buscar template" }
    }
}

// ============================================================
// MUTATIONS
// ============================================================

export async function createTemplate(
    data: CreateTemplateData
): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        // Validar dados
        const validated = createTemplateSchema.safeParse(data)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        // Verificar se o workspace pertence ao usuário
        const workspace = await prisma.workspace.findFirst({
            where: { id: validated.data.workspaceId, userId: user.id },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        // Criar template
        const template = await prisma.emailTemplate.create({
            data: {
                name: validated.data.name,
                subject: validated.data.subject,
                body: validated.data.body,
                category: validated.data.category,
                isActive: validated.data.isActive,
                workspaceId: validated.data.workspaceId,
            },
        })

        revalidatePath("/templates")
        return { success: true, data: { id: template.id } }
    } catch (error) {
        console.error("Erro ao criar template:", error)
        return { success: false, error: "Erro ao criar template" }
    }
}

export async function updateTemplate(
    id: string,
    data: UpdateTemplateData
): Promise<ActionResult> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        // Validar dados
        const validated = updateTemplateSchema.safeParse(data)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        // Verificar se o template existe e pertence ao usuário
        const existingTemplate = await prisma.emailTemplate.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
        })

        if (!existingTemplate) {
            return { success: false, error: "Template não encontrado" }
        }

        // Atualizar
        await prisma.emailTemplate.update({
            where: { id },
            data: validated.data,
        })

        revalidatePath("/templates")
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar template:", error)
        return { success: false, error: "Erro ao atualizar template" }
    }
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        // Verificar se o template existe e pertence ao usuário
        const template = await prisma.emailTemplate.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
            include: {
                _count: { select: { campaigns: true } },
            },
        })

        if (!template) {
            return { success: false, error: "Template não encontrado" }
        }

        // Verificar se está em uso
        if (template._count.campaigns > 0) {
            return {
                success: false,
                error: `Este template está sendo usado em ${template._count.campaigns} campanha(s). Remova-o das campanhas primeiro.`,
            }
        }

        // Excluir
        await prisma.emailTemplate.delete({ where: { id } })

        revalidatePath("/templates")
        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir template:", error)
        return { success: false, error: "Erro ao excluir template" }
    }
}

export async function duplicateTemplate(id: string): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        // Buscar template original
        const original = await prisma.emailTemplate.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
        })

        if (!original) {
            return { success: false, error: "Template não encontrado" }
        }

        // Criar cópia
        const copy = await prisma.emailTemplate.create({
            data: {
                name: `${original.name} (cópia)`,
                subject: original.subject,
                body: original.body,
                category: original.category,
                isActive: true,
                workspaceId: original.workspaceId,
            },
        })

        revalidatePath("/templates")
        return { success: true, data: { id: copy.id } }
    } catch (error) {
        console.error("Erro ao duplicar template:", error)
        return { success: false, error: "Erro ao duplicar template" }
    }
}

export async function toggleTemplateActive(id: string): Promise<ActionResult> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const template = await prisma.emailTemplate.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
        })

        if (!template) {
            return { success: false, error: "Template não encontrado" }
        }

        await prisma.emailTemplate.update({
            where: { id },
            data: { isActive: !template.isActive },
        })

        revalidatePath("/templates")
        return { success: true }
    } catch (error) {
        console.error("Erro ao alterar status:", error)
        return { success: false, error: "Erro ao alterar status" }
    }
}