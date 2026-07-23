"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export interface AuditLogRow {
    id: string
    actorEmail: string
    action: string
    targetType: string
    targetId: string
    metadata: unknown
    ip: string | null
    createdAt: string
}

const PAGE_SIZE = 50

export async function getAuditLogs(filters: {
    actorId?: string
    action?: string
    page?: number
} = {}): Promise<{ items: AuditLogRow[]; total: number }> {
    await requireAdmin()

    const page = Math.max(1, filters.page ?? 1)
    const where = {
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.actorId ? { actorId: filters.actorId } : {}),
    }

    const [rows, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.auditLog.count({ where }),
    ])

    return {
        items: rows.map((r) => ({
            id: r.id,
            actorEmail: r.actorEmail,
            action: r.action,
            targetType: r.targetType,
            targetId: r.targetId,
            metadata: r.metadata,
            ip: r.ip,
            createdAt: r.createdAt.toISOString(),
        })),
        total,
    }
}
