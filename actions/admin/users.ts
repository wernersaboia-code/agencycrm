"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import type { Prisma, UserRole, UserStatus } from "@prisma/client"

// ==================== TIPOS ====================

export interface UserListItem {
    id: string
    email: string
    name: string | null
    role: UserRole
    status: UserStatus
    createdAt: string
    lastLoginAt: string | null
    _count: {
        workspaces: number
    }
}

export interface UserDetails {
    id: string
    email: string
    name: string | null
    avatar: string | null
    role: UserRole
    status: UserStatus
    language: string
    timezone: string
    createdAt: string
    lastLoginAt: string | null
    workspaces: {
        id: string
        name: string
        color: string
        _count: {
            leads: number
            campaigns: number
            calls: number
        }
    }[]
    _count: {
        workspaces: number
        purchases: number
    }
}

export interface UsersFilters {
    search?: string
    role?: UserRole | "ALL"
    status?: UserStatus | "ALL"
    page?: number
    limit?: number
}

// ==================== LISTAR USUÁRIOS ====================

export async function getUsers(filters: UsersFilters = {}) {
    await requireAdmin()

    const {
        search = "",
        role = "ALL",
        status = "ALL",
        page = 1,
        limit = 20,
    } = filters

    const skip = (page - 1) * limit

    // Construir where clause
    const where: Prisma.UserWhereInput = {}

    if (search) {
        where.OR = [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
        ]
    }

    if (role !== "ALL") {
        where.role = role
    }

    if (status !== "ALL") {
        where.status = status
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
                _count: {
                    select: {
                        workspaces: true,
                    },
                },
            },
        }),
        prisma.user.count({ where }),
    ])

    // Serializar datas
    const serializedUsers: UserListItem[] = users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
    }))

    return {
        users: serializedUsers,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
    }
}

// ==================== DETALHES DO USUÁRIO ====================

export async function getUserDetails(userId: string): Promise<UserDetails | null> {
    await requireAdmin()

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            workspaces: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                    _count: {
                        select: {
                            leads: true,
                            campaigns: true,
                            calls: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    workspaces: true,
                    purchases: true,
                },
            },
        },
    })

    if (!user) return null

    return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
    }
}

// ==================== ALTERAR ROLE ====================

export async function updateUserRole(userId: string, role: UserRole) {
    await requireAdmin()

    await prisma.user.update({
        where: { id: userId },
        data: { role },
    })

    revalidatePath("/super-admin/users")
    revalidatePath(`/super-admin/users/${userId}`)

    return { success: true }
}

// ==================== ALTERAR STATUS ====================

export async function updateUserStatus(userId: string, status: UserStatus) {
    await requireAdmin()

    await prisma.user.update({
        where: { id: userId },
        data: { status },
    })

    revalidatePath("/super-admin/users")
    revalidatePath(`/super-admin/users/${userId}`)

    return { success: true }
}

// ==================== RESET DE SENHA ====================

export async function sendPasswordReset(email: string) {
    await requireAdmin()

    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
        console.error("Password reset error:", error)
        throw new Error("Erro ao enviar email de reset")
    }

    return { success: true }
}

// ==================== ESTATÍSTICAS DO USUÁRIO ====================

export async function getUserStats(userId: string) {
    await requireAdmin()

    const [
        totalLeads,
        totalCampaigns,
        totalCalls,
        totalEmails,
        recentActivity,
    ] = await Promise.all([
        // Total de leads em todos os workspaces do usuário
        prisma.lead.count({
            where: {
                workspace: { userId },
            },
        }),
        // Total de campanhas
        prisma.campaign.count({
            where: {
                workspace: { userId },
            },
        }),
        // Total de ligações
        prisma.call.count({
            where: {
                workspace: { userId },
            },
        }),
        // Total de emails enviados
        prisma.emailSend.count({
            where: {
                campaign: {
                    workspace: { userId },
                },
            },
        }),
        // Última atividade (última campanha enviada)
        prisma.campaign.findFirst({
            where: {
                workspace: { userId },
                sentAt: { not: null },
            },
            orderBy: { sentAt: "desc" },
            select: { sentAt: true },
        }),
    ])

    return {
        totalLeads,
        totalCampaigns,
        totalCalls,
        totalEmails,
        lastActivity: recentActivity?.sentAt?.toISOString() || null,
    }
}
