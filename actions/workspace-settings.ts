// actions/workspace-settings.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser, requireWorkspaceAccess } from "@/lib/auth"
import { testSmtpConnection, type SmtpConfig } from "@/lib/email"
import { encryptSecret } from "@/lib/secrets"
import { z } from "zod"
import {
    resolveSendWindow,
    windowCoversCronRun,
    describeCronHourIn,
    CRON_SEND_HOUR_UTC,
} from "@/lib/campaigns/send-window"
import { addSuppression, removeSuppression } from "@/lib/campaigns/suppression"

// ============================================================
// TIPOS
// ============================================================

interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

export interface WorkspaceSettingsData {
    name: string
    description?: string | null
    color: string
    logo?: string | null
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

const sendWindowSchema = z
    .object({
        sendWindowEnabled: z.boolean(),
        sendTimezone: z.string().min(1, "Selecione um fuso horário"),
        sendDays: z
            .array(z.number().int().min(1).max(7))
            .min(1, "Selecione ao menos um dia"),
        sendStartHour: z
            .number()
            .int()
            .min(0, "A hora inicial deve estar entre 0 e 23")
            .max(23, "A hora inicial deve estar entre 0 e 23"),
        sendEndHour: z
            .number()
            .int()
            .min(1, "A hora final deve estar entre 1 e 24")
            .max(24, "A hora final deve estar entre 1 e 24"),
        sendJitterMinutes: z
            .number()
            .int()
            .min(0, "A variação deve estar entre 0 e 120 minutos")
            .max(120, "A variação deve estar entre 0 e 120 minutos"),
    })
    .refine((data) => data.sendEndHour > data.sendStartHour, {
        message: "O fim da janela precisa ser depois do início",
        path: ["sendEndHour"],
    })
    // Guard crítico: o cron de envio roda uma vez por dia, sempre no mesmo
    // horário UTC. Janela que não contenha esse instante nunca envia nada — o
    // motor adia, o cron volta no mesmo horário e adia de novo, para sempre.
    // Recusar na escrita é a única forma de o usuário descobrir isso na hora
    // de salvar, e não semanas depois com a campanha parada em silêncio.
    .refine((data) => windowCoversCronRun(resolveSendWindow(data, null)), {
        path: ["sendStartHour"],
        // zod v4 não aceita mais uma função para o params inteiro do refine —
        // só `error` pode ser função, recebendo o issue (com `.input` cru).
        error: (issue) => {
            const data = issue.input as { sendTimezone: string }
            return `Os envios saem uma vez por dia, às ${CRON_SEND_HOUR_UTC}h UTC (${describeCronHourIn(
                data.sendTimezone
            )} no fuso escolhido). A janela precisa incluir esse horário, senão nenhum e-mail é enviado.`
        },
    })

export type SendWindowSettingsData = z.infer<typeof sendWindowSchema>

const replyDetectionSchema = z.object({
    replyDetectionEnabled: z.boolean(),
    imapHost: z.string().optional().nullable(),
    imapPort: z.number().int().min(1).max(65535).optional().nullable(),
})

export type ReplyDetectionSettingsData = z.infer<typeof replyDetectionSchema>

async function hasWorkspaceAccess(workspaceId: string): Promise<boolean> {
    try {
        await requireWorkspaceAccess(workspaceId)
        return true
    } catch {
        return false
    }
}

// ============================================================
// QUERIES
// ============================================================

/**
 * Busca configurações gerais do workspace
 */
export async function getWorkspaceSettings(workspaceId: string) {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return null
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                logo: true,
                senderName: true,
                senderEmail: true,
            },
        })

        return workspace
    } catch (error) {
        console.error("Erro ao buscar configurações:", error)
        return null
    }
}

/**
 * Busca configurações de SMTP do workspace
 */
export async function getWorkspaceSmtpSettings(
    workspaceId: string
): Promise<ActionResult<{
    id: string
    name: string
    smtpProvider: string | null
    smtpHost: string | null
    smtpPort: number | null
    smtpUser: string | null
    smtpPass: null
    smtpSecure: boolean
    senderName: string | null
    senderEmail: string | null
}>> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: {
                id: true,
                name: true,
                smtpProvider: true,
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                smtpSecure: true,
                senderName: true,
                senderEmail: true,
            },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        return { success: true, data: { ...workspace, smtpPass: null } }
    } catch (error) {
        console.error("Erro ao buscar configurações:", error)
        return { success: false, error: "Erro ao buscar configurações" }
    }
}

// ============================================================
// MUTATIONS - WORKSPACE GERAL
// ============================================================

/**
 * Atualiza configurações gerais do workspace
 */
export async function updateWorkspaceSettings(
    workspaceId: string,
    data: WorkspaceSettingsData
): Promise<ActionResult> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                name: data.name,
                description: data.description || null,
                color: data.color,
                logo: data.logo,
            },
        })

        revalidatePath("/settings")
        revalidatePath("/dashboard")
        revalidatePath("/workspaces")

        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar workspace:", error)
        return { success: false, error: "Erro ao atualizar configurações." }
    }
}

/**
 * Atualiza apenas a logo do workspace
 */
export async function updateWorkspaceLogo(
    workspaceId: string,
    logoUrl: string | null
): Promise<ActionResult> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: { logo: logoUrl },
        })

        revalidatePath("/settings")
        revalidatePath("/dashboard")
        revalidatePath("/workspaces")

        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar logo:", error)
        return { success: false, error: "Erro ao atualizar logo." }
    }
}

// ============================================================
// MUTATIONS - SMTP
// ============================================================

/**
 * Salva configurações de SMTP
 */
export async function saveSmtpSettings(
    workspaceId: string,
    data: SmtpSettingsData
): Promise<ActionResult> {
    try {
        // Validar dados
        const validated = smtpSettingsSchema.safeParse(data)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
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
                smtpPass: encryptSecret(validated.data.smtpPass),
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

/**
 * Testa conexão SMTP
 */
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

/**
 * Limpa configurações de SMTP
 */
export async function clearSmtpSettings(workspaceId: string): Promise<ActionResult> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
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

// ============================================================
// MUTATIONS - JANELA DE ENVIO
// ============================================================

export interface SendSettingsData {
    window: SendWindowSettingsData
    replyDetection: ReplyDetectionSettingsData
}

/**
 * Busca a janela de envio e a configuração de detecção de resposta do workspace.
 */
export async function getSendWindowSettings(
    workspaceId: string
): Promise<ActionResult<SendSettingsData>> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: {
                sendWindowEnabled: true,
                sendTimezone: true,
                sendDays: true,
                sendStartHour: true,
                sendEndHour: true,
                sendJitterMinutes: true,
                replyDetectionEnabled: true,
                imapHost: true,
                imapPort: true,
            },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const { replyDetectionEnabled, imapHost, imapPort, ...window } = workspace

        return {
            success: true,
            data: {
                window,
                replyDetection: { replyDetectionEnabled, imapHost, imapPort },
            },
        }
    } catch (error) {
        console.error("Erro ao buscar configurações de envio:", error)
        return { success: false, error: "Erro ao buscar configurações de envio" }
    }
}

/**
 * Atualiza a configuração de detecção de resposta (IMAP) do workspace.
 * A senha usada é a mesma do SMTP — não há credencial separada.
 */
export async function updateReplyDetectionSettings(
    workspaceId: string,
    data: ReplyDetectionSettingsData
): Promise<ActionResult> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const parsed = replyDetectionSchema.safeParse(data)
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message || "Dados inválidos",
            }
        }

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                replyDetectionEnabled: parsed.data.replyDetectionEnabled,
                imapHost: parsed.data.imapHost || null,
                imapPort: parsed.data.imapPort || null,
            },
        })

        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar detecção de resposta:", error)
        return { success: false, error: "Erro ao atualizar detecção de resposta." }
    }
}

/**
 * Atualiza a janela de envio de cold mail do workspace.
 */
export async function updateSendWindowSettings(
    workspaceId: string,
    data: SendWindowSettingsData
): Promise<ActionResult> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const parsed = sendWindowSchema.safeParse(data)
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message || "Dados inválidos",
            }
        }

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                sendWindowEnabled: parsed.data.sendWindowEnabled,
                sendTimezone: parsed.data.sendTimezone,
                sendDays: parsed.data.sendDays,
                sendStartHour: parsed.data.sendStartHour,
                sendEndHour: parsed.data.sendEndHour,
                sendJitterMinutes: parsed.data.sendJitterMinutes,
            },
        })

        revalidatePath("/settings")

        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar janela de envio:", error)
        return { success: false, error: "Erro ao atualizar janela de envio." }
    }
}

// ============================================================
// MUTATIONS - LISTA DE SUPRESSÃO
// ============================================================

export interface SuppressionRow {
    id: string
    email: string
    reason: string
    detail: string | null
    createdAt: string
    isGlobal: boolean
}

/**
 * Lista as supressões que afetam este workspace (as próprias e as globais).
 */
export async function listWorkspaceSuppressions(
    workspaceId: string
): Promise<ActionResult<SuppressionRow[]>> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const rows = await prisma.suppression.findMany({
            where: { OR: [{ workspaceId: null }, { workspaceId }] },
            orderBy: { createdAt: "desc" },
            take: 200,
        })

        return {
            success: true,
            data: rows.map((row) => ({
                id: row.id,
                email: row.email,
                reason: row.reason,
                detail: row.detail,
                createdAt: row.createdAt.toISOString(),
                isGlobal: row.workspaceId === null,
            })),
        }
    } catch (error) {
        console.error("Erro ao listar supressões:", error)
        return { success: false, error: "Erro ao listar supressões" }
    }
}

export async function addWorkspaceSuppression(
    workspaceId: string,
    email: string
): Promise<ActionResult> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const parsed = z.string().email("E-mail inválido").safeParse(email.trim())
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message }
        }

        await addSuppression(prisma, {
            email: parsed.data,
            workspaceId,
            reason: "manual",
        })

        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Erro ao adicionar supressão:", error)
        return { success: false, error: "Erro ao adicionar supressão" }
    }
}

export async function deleteWorkspaceSuppression(
    workspaceId: string,
    id: string
): Promise<ActionResult> {
    try {
        const canAccessWorkspace = await hasWorkspaceAccess(workspaceId)
        if (!canAccessWorkspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        // removeSuppression filtra por workspaceId — supressão global não sai daqui.
        await removeSuppression(prisma, id, workspaceId)

        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Erro ao remover supressão:", error)
        return { success: false, error: "Erro ao remover supressão" }
    }
}
