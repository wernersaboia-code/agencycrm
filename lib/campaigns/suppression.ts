// lib/campaigns/suppression.ts

import type { PrismaClient } from "@prisma/client"

export type SuppressionReason = "hard_bounce" | "complaint" | "unsubscribe" | "manual"

export interface AddSuppressionInput {
    email: string
    /** null = supressão global (vale para todos os workspaces). */
    workspaceId: string | null
    reason: SuppressionReason
    detail?: string | null
}

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
}

/**
 * Fail-CLOSED de propósito: se o banco falhar, tratamos como suprimido e não
 * enviamos. Mandar e-mail para quem pediu para sair (ou para um endereço morto)
 * custa reputação de domínio; deixar de mandar um e-mail não custa nada.
 */
export async function isSuppressed(
    db: PrismaClient,
    email: string,
    workspaceId: string
): Promise<boolean> {
    try {
        const found = await db.suppression.findFirst({
            where: {
                email: normalizeEmail(email),
                OR: [{ workspaceId: null }, { workspaceId }],
            },
            select: { id: true },
        })
        return found !== null
    } catch (error) {
        console.error("[Suppression] Falha ao consultar supressão:", error)
        return true
    }
}

/**
 * Versão em lote de `isSuppressed`, para não consultar o banco por destinatário.
 * Devolve o conjunto de e-mails normalizados que estão suprimidos.
 *
 * Ao contrário de `isSuppressed`, esta **propaga** o erro em vez de devolver
 * "tudo suprimido": ela é chamada antes de qualquer envio do lote, então
 * deixar a exceção subir aborta o disparo inteiro sem mandar e-mail nenhum —
 * que é o comportamento fail-closed correto. Devolver o conjunto cheio faria o
 * chamador marcar todos os envios como bounce de supressão, gravando um dado
 * falso e irreversível por causa de uma falha transitória de banco.
 */
export async function filterSuppressed(
    db: PrismaClient,
    emails: string[],
    workspaceId: string
): Promise<Set<string>> {
    const normalized = emails.map(normalizeEmail)

    const rows = await db.suppression.findMany({
        where: {
            email: { in: normalized },
            OR: [{ workspaceId: null }, { workspaceId }],
        },
        select: { email: true },
    })

    return new Set(rows.map((row) => row.email))
}

/**
 * Registra uma supressão. NUNCA lança: uma falha aqui não pode derrubar o
 * fluxo de envio ou de unsubscribe que a originou.
 */
export async function addSuppression(
    db: PrismaClient,
    input: AddSuppressionInput
): Promise<void> {
    const email = normalizeEmail(input.email)

    try {
        const existing = await db.suppression.findFirst({
            where: { email, workspaceId: input.workspaceId },
            select: { id: true },
        })

        if (existing) {
            return
        }

        await db.suppression.create({
            data: {
                email,
                workspaceId: input.workspaceId,
                reason: input.reason,
                detail: input.detail ?? null,
            },
        })
    } catch (error) {
        console.error("[Suppression] Falha ao registrar supressão:", error)
    }
}

/**
 * Remove uma supressão do próprio workspace. O filtro por `workspaceId` no
 * `deleteMany` é o que impede um workspace de apagar a supressão de outro
 * (ou uma supressão global).
 */
export async function removeSuppression(
    db: PrismaClient,
    id: string,
    workspaceId: string
): Promise<void> {
    await db.suppression.deleteMany({ where: { id, workspaceId } })
}
