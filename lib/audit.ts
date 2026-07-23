import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export type AuditAction =
    | "user.role_changed"
    | "user.status_changed"
    | "user.password_reset_sent"
    | "workspace.transferred"
    | "workspace.deleted"
    | "list.deleted"
    | "marketplace_lead.deleted"

export interface AuditInput {
    actorId: string
    actorEmail: string
    action: AuditAction
    targetType: string
    targetId: string
    metadata?: Record<string, unknown> | null
    ip?: string | null
}

/**
 * Monta o objeto `data` do Prisma. Puro e testável — sem tocar no banco.
 */
export function buildAuditData(input: AuditInput): Prisma.AuditLogUncheckedCreateInput {
    return {
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: (input.metadata ?? null) as Prisma.InputJsonValue,
        ip: input.ip ?? null,
    }
}

/**
 * Grava um registro de auditoria. NUNCA lança: uma falha aqui não pode
 * derrubar a ação administrativa que a originou — apenas registra no console.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
    try {
        await prisma.auditLog.create({ data: buildAuditData(input) })
    } catch (error) {
        console.error("[Audit] Falha ao gravar registro de auditoria:", error)
    }
}
