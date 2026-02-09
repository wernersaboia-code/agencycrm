// actions/workspace-settings.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import { testSmtpConnection, type SmtpConfig } from "@/lib/email"
import { z } from "zod"

// ============================================================
// TIPOS
// ============================================================

interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

// ============================================================
// SCHEMAS
// ============================================================

const smtpSettingsSchema = z.object({
    smtpProvider: z.string().min(1, "Selecione um provedor"),
    smtpHost: z.string().optional().nullable(),
    smtpPort: z.number().optional().nullable(),
    smtpUser: z.string().email("Email inválido"),
    smtpPass: z.string().min(1, "Senha é obrigatória"),
    smtpSecure: z.boolean().default(false),
    senderName: z.string().optional().nullable(),
    senderEmail: z.string().email("Email inválido").optional().nullable(),
})

export type SmtpSettingsData = z.infer<typeof smtpSettingsSchema>

// ============================================================
// QUERIES
// ============================================================

export async function getWorkspaceSmtpSettings(
    workspaceId: string
): Promise<ActionResult<{
    id: string
    name: string
    smtpProvider: string | null
    smtpHost: string | null
    smtpPort: number | null
    smtpUser: string | null
    smtpPass: string | null
    smtpSecure: boolean
    senderName: string | null
    senderEmail: string | null
}>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId: user.id },
            select: {
                id: true,
                name: true,
                smtpProvider: true,
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                smtpPass: true,
                smtpSecure: true,
                senderName: true,
                senderEmail: true,
            },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        return { success: true, data: workspace }
    } catch (error) {
        console.error("Erro ao buscar configurações:", error)
        return { success: false, error: "Erro ao buscar configurações" }
    }
}

// ============================================================
// MUTATIONS
// ============================================================

export async function saveSmtpSettings(
    workspaceId: string,
    data: SmtpSettingsData
): Promise<ActionResult> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        // Validar dados
        const validated = smtpSettingsSchema.safeParse(data)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        // Verificar se o workspace pertence ao usuário
        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId: user.id },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        // Salvar configurações
        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                smtpProvider: validated.data.smtpProvider,
                smtpHost: validated.data.smtpHost,
                smtpPort: validated.data.smtpPort,
                smtpUser: validated.data.smtpUser,
                smtpPass: validated.data.smtpPass,
                smtpSecure: validated.data.smtpSecure,
                senderName: validated.data.senderName,
                senderEmail: validated.data.senderEmail || validated.data.smtpUser,
            },
        })

        revalidatePath("/settings")
        revalidatePath("/workspaces")
        return { success: true }
    } catch (error) {
        console.error("Erro ao salvar configurações:", error)
        return { success: false, error: "Erro ao salvar configurações" }
    }
}

export async function testSmtpSettings(
    data: SmtpSettingsData
): Promise<ActionResult<{ message: string }>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        // Validar dados
        const validated = smtpSettingsSchema.safeParse(data)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        // Testar conexão
        const config: SmtpConfig = {
            provider: validated.data.smtpProvider,
            host: validated.data.smtpHost || null,
            port: validated.data.smtpPort || null,
            user: validated.data.smtpUser,
            pass: validated.data.smtpPass,
            secure: validated.data.smtpSecure,
            senderName: validated.data.senderName || null,
            senderEmail: validated.data.senderEmail || null,
        }

        const result = await testSmtpConnection(config)

        if (result.success) {
            return { success: true, data: { message: "Conexão estabelecida com sucesso!" } }
        } else {
            return { success: false, error: result.error || "Falha na conexão" }
        }
    } catch (error) {
        console.error("Erro ao testar conexão:", error)
        return { success: false, error: "Erro ao testar conexão" }
    }
}

export async function clearSmtpSettings(workspaceId: string): Promise<ActionResult> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId: user.id },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                smtpProvider: null,
                smtpHost: null,
                smtpPort: null,
                smtpUser: null,
                smtpPass: null,
                smtpSecure: true,
                senderName: null,
                senderEmail: null,
            },
        })

        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Erro ao limpar configurações:", error)
        return { success: false, error: "Erro ao limpar configurações" }
    }
}