// lib/auth.ts

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { UserRole, UserStatus } from '@prisma/client'

// ============================================================
// TIPOS
// ============================================================

export interface AuthenticatedUser {
    id: string
    email: string
    name: string | null
}

export interface AuthenticatedDbUser extends AuthenticatedUser {
    role: UserRole
    status: UserStatus
    activeWorkspaceId: string | null
}

// ============================================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================================

/**
 * Obtém o usuário autenticado a partir da sessão do Supabase.
 * Cria o usuário no banco de dados se não existir (primeiro login).
 *
 * @returns O usuário autenticado ou null se não estiver logado
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
    try {
        const supabase = await createClient()

        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()

        if (error || !supabaseUser || !supabaseUser.email) {
            return null
        }

        // Busca o usuário no banco
        let user = await prisma.user.findUnique({
            where: { id: supabaseUser.id },
            select: {
                id: true,
                email: true,
                name: true,
                status: true,
            }
        })

        // Se não existe, cria (primeiro login)
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    name: supabaseUser.user_metadata?.name ??
                        supabaseUser.user_metadata?.full_name ??
                        supabaseUser.email.split('@')[0],
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    status: true,
                }
            })
        }

        if (user.status !== 'ACTIVE') {
            return null
        }

        return user
    } catch (error) {
        console.error('[Auth] Erro ao obter usuário autenticado:', error)
        return null
    }
}

export async function getAuthenticatedDbUser(): Promise<AuthenticatedDbUser | null> {
    const supabase = await createClient()

    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()

    if (error || !supabaseUser || !supabaseUser.email) {
        return null
    }

    let user = await prisma.user.findUnique({
        where: { id: supabaseUser.id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            activeWorkspaceId: true,
        }
    })

    if (!user) {
        user = await prisma.user.create({
            data: {
                id: supabaseUser.id,
                email: supabaseUser.email,
                name: supabaseUser.user_metadata?.name ??
                    supabaseUser.user_metadata?.full_name ??
                    supabaseUser.email.split('@')[0],
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                activeWorkspaceId: true,
            }
        })
    }

    return user
}

export async function getAuthenticatedActiveDbUser(): Promise<AuthenticatedDbUser | null> {
    const user = await getAuthenticatedDbUser()

    if (!user || user.status !== 'ACTIVE') {
        return null
    }

    return user
}

/**
 * Verifica se existe um usuário autenticado (mais leve, sem buscar no banco)
 *
 * @returns true se autenticado, false caso contrário
 */
export async function isAuthenticated(): Promise<boolean> {
    return (await getAuthenticatedUser()) !== null
}

/**
 * Obtém apenas o ID do usuário autenticado (mais leve)
 *
 * @returns O ID do usuário ou null
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
    try {
        const user = await getAuthenticatedUser()
        return user?.id ?? null
    } catch {
        return null
    }
}

/**
 * Obtém o usuário autenticado ou lança erro (para uso em Server Actions)
 *
 * @throws Error se não estiver autenticado
 * @returns O usuário autenticado
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
    const user = await getAuthenticatedUser()

    if (!user) {
        throw new Error('Não autenticado')
    }

    return user
}

export function isAuthenticationError(error: unknown): boolean {
    return error instanceof Error && error.message.toLowerCase().includes('autentic')
}

export async function requireAdmin(): Promise<AuthenticatedDbUser> {
    const user = await getAuthenticatedActiveDbUser()

    if (!user) {
        throw new Error('Nao autenticado')
    }

    if (user.role !== 'ADMIN') {
        throw new Error('Acesso negado')
    }

    return user
}

export async function requireWorkspaceAccess(workspaceId: string): Promise<AuthenticatedUser> {
    const user = await requireAuth()

    const workspace = await prisma.workspace.findFirst({
        where: {
            id: workspaceId,
            userId: user.id,
        },
        select: { id: true },
    })

    if (!workspace) {
        throw new Error('Workspace nao encontrado')
    }

    return user
}
