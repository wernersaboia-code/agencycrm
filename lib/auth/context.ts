import { prisma } from "@/lib/prisma"
import {
    getAuthenticatedUser,
    requireAuth,
    requireWorkspaceAccess,
    type AuthenticatedUser,
} from "@/lib/auth"
import type { PrismaClient } from "@prisma/client"

export interface ServiceContext {
    user: AuthenticatedUser
    prisma: PrismaClient
}

/**
 * Create a service context for authenticated requests.
 * Returns the user and prisma client, or null if not authenticated.
 */
export async function createServiceContext(): Promise<
    | { ok: true; ctx: ServiceContext }
    | { ok: false; error: string }
> {
    const user = await getAuthenticatedUser()
    if (!user) {
        return { ok: false, error: "Não autenticado" }
    }
    return { ok: true, ctx: { user, prisma } }
}

/**
 * Create a service context that requires workspace access.
 */
export async function createWorkspaceServiceContext(
    workspaceId: string
): Promise<
    | { ok: true; ctx: ServiceContext }
    | { ok: false; error: string }
> {
    try {
        const user = await requireWorkspaceAccess(workspaceId)
        return { ok: true, ctx: { user, prisma } }
    } catch {
        return { ok: false, error: "Workspace não encontrado" }
    }
}

/**
 * Create a service context that only requires auth (no workspace check).
 * Useful for admin routes or cross-workspace queries.
 */
export async function createAuthServiceContext(): Promise<
    | { ok: true; ctx: ServiceContext }
    | { ok: false; error: string }
> {
    try {
        const user = await requireAuth()
        return { ok: true, ctx: { user, prisma } }
    } catch {
        return { ok: false, error: "Não autenticado" }
    }
}
