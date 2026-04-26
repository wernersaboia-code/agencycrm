// actions/admin/workspaces.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

// ==================== TIPOS ====================

export interface WorkspaceListItem {
    id: string
    name: string
    color: string
    logo: string | null
    createdAt: string
    user: {
        id: string
        name: string | null
        email: string
    }
    _count: {
        leads: number
        campaigns: number
        calls: number
        emailTemplates: number
    }
}

export interface WorkspaceDetails {
    id: string
    name: string
    description: string | null
    color: string
    logo: string | null
    senderName: string | null
    senderEmail: string | null
    smtpProvider: string | null
    createdAt: string
    updatedAt: string
    user: {
        id: string
        name: string | null
        email: string
    }
    _count: {
        leads: number
        campaigns: number
        calls: number
        emailTemplates: number
        tags: number
    }
}

export interface WorkspaceStats {
    totalLeads: number
    leadsByStatus: { status: string; count: number }[]
    totalCampaigns: number
    campaignsSent: number
    totalEmails: number
    emailsOpened: number
    openRate: number
    totalCalls: number
    callsAnswered: number
    recentCampaigns: {
        id: string
        name: string
        status: string
        sentAt: string | null
        totalSent: number
    }[]
}

export interface WorkspacesFilters {
    search?: string
    userId?: string
    page?: number
    limit?: number
}

// ==================== LISTAR WORKSPACES ====================

export async function getWorkspaces(filters: WorkspacesFilters = {}) {
    await requireAdmin()

    const {
        search = "",
        userId,
        page = 1,
        limit = 20,
    } = filters

    const skip = (page - 1) * limit

    // Construir where clause
    const where: Prisma.WorkspaceWhereInput = {}

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { user: { name: { contains: search, mode: "insensitive" } } },
        ]
    }

    if (userId) {
        where.userId = userId
    }

    const [workspaces, total] = await Promise.all([
        prisma.workspace.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                id: true,
                name: true,
                color: true,
                logo: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        leads: true,
                        campaigns: true,
                        calls: true,
                        emailTemplates: true,
                    },
                },
            },
        }),
        prisma.workspace.count({ where }),
    ])

    // Serializar
    const serialized: WorkspaceListItem[] = workspaces.map((ws) => ({
        ...ws,
        createdAt: ws.createdAt.toISOString(),
    }))

    return {
        workspaces: serialized,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
    }
}

// ==================== DETALHES DO WORKSPACE ====================

export async function getWorkspaceDetails(workspaceId: string): Promise<WorkspaceDetails | null> {
    await requireAdmin()

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    leads: true,
                    campaigns: true,
                    calls: true,
                    emailTemplates: true,
                    tags: true,
                },
            },
        },
    })

    if (!workspace) return null

    return {
        ...workspace,
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
    }
}

// ==================== ESTATÍSTICAS DO WORKSPACE ====================

export async function getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
    await requireAdmin()

    const [
        totalLeads,
        leadsByStatus,
        totalCampaigns,
        campaignsSent,
        emailStats,
        callStats,
        recentCampaigns,
    ] = await Promise.all([
        // Total de leads
        prisma.lead.count({ where: { workspaceId } }),

        // Leads por status
        prisma.lead.groupBy({
            by: ["status"],
            where: { workspaceId },
            _count: { id: true },
        }),

        // Total de campanhas
        prisma.campaign.count({ where: { workspaceId } }),

        // Campanhas enviadas
        prisma.campaign.count({
            where: { workspaceId, status: "SENT" },
        }),

        // Emails
        prisma.emailSend.aggregate({
            where: { campaign: { workspaceId } },
            _count: { id: true },
            _sum: { openCount: true },
        }),

        // Ligações
        prisma.call.groupBy({
            by: ["result"],
            where: { workspaceId },
            _count: { id: true },
        }),

        // Campanhas recentes
        prisma.campaign.findMany({
            where: { workspaceId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                name: true,
                status: true,
                sentAt: true,
                totalSent: true,
            },
        }),
    ])

    // Calcular métricas
    const totalEmails = emailStats._count.id || 0
    const emailsOpened = emailStats._sum.openCount || 0
    const openRate = totalEmails > 0 ? Math.round((emailsOpened / totalEmails) * 100) : 0

    const totalCalls = callStats.reduce((acc, c) => acc + c._count.id, 0)
    const answeredResults = ["ANSWERED", "INTERESTED", "NOT_INTERESTED", "CALLBACK", "MEETING_SCHEDULED"]
    const callsAnswered = callStats
        .filter((c) => answeredResults.includes(c.result))
        .reduce((acc, c) => acc + c._count.id, 0)

    return {
        totalLeads,
        leadsByStatus: leadsByStatus.map((l) => ({
            status: l.status,
            count: l._count.id,
        })),
        totalCampaigns,
        campaignsSent,
        totalEmails,
        emailsOpened,
        openRate,
        totalCalls,
        callsAnswered,
        recentCampaigns: recentCampaigns.map((c) => ({
            ...c,
            sentAt: c.sentAt?.toISOString() || null,
        })),
    }
}

// ==================== TRANSFERIR WORKSPACE ====================

export async function transferWorkspace(workspaceId: string, newUserId: string) {
    await requireAdmin()

    // Verificar se o novo usuário existe
    const newUser = await prisma.user.findUnique({
        where: { id: newUserId },
    })

    if (!newUser) {
        throw new Error("Usuário não encontrado")
    }

    // Transferir
    await prisma.workspace.update({
        where: { id: workspaceId },
        data: { userId: newUserId },
    })

    revalidatePath("/super-admin/workspaces")
    revalidatePath(`/super-admin/workspaces/${workspaceId}`)

    return { success: true }
}

// ==================== DELETAR WORKSPACE ====================

export async function deleteWorkspace(workspaceId: string) {
    await requireAdmin()

    // O Prisma vai deletar em cascata (leads, campaigns, etc.)
    await prisma.workspace.delete({
        where: { id: workspaceId },
    })

    revalidatePath("/super-admin/workspaces")

    return { success: true }
}

// ==================== EXPORTAR DADOS DO WORKSPACE ====================

export async function exportWorkspaceData(workspaceId: string) {
    await requireAdmin()

    const [workspace, leads, campaigns, calls, templates] = await Promise.all([
        prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                user: {
                    select: { email: true, name: true },
                },
            },
        }),
        prisma.lead.findMany({
            where: { workspaceId },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                company: true,
                jobTitle: true,
                status: true,
                source: true,
                country: true,
                city: true,
                createdAt: true,
            },
        }),
        prisma.campaign.findMany({
            where: { workspaceId },
            select: {
                name: true,
                status: true,
                type: true,
                totalRecipients: true,
                totalSent: true,
                totalOpened: true,
                totalClicked: true,
                sentAt: true,
                createdAt: true,
            },
        }),
        prisma.call.findMany({
            where: { workspaceId },
            select: {
                result: true,
                duration: true,
                notes: true,
                calledAt: true,
                lead: {
                    select: { email: true, firstName: true, lastName: true },
                },
            },
        }),
        prisma.emailTemplate.findMany({
            where: { workspaceId },
            select: {
                name: true,
                subject: true,
                category: true,
                createdAt: true,
            },
        }),
    ])

    if (!workspace) {
        throw new Error("Workspace não encontrado")
    }

    // Serializar datas
    const exportData = {
        workspace: {
            name: workspace.name,
            description: workspace.description,
            owner: workspace.user,
            exportedAt: new Date().toISOString(),
        },
        leads: leads.map((l) => ({
            ...l,
            createdAt: l.createdAt.toISOString(),
        })),
        campaigns: campaigns.map((c) => ({
            ...c,
            sentAt: c.sentAt?.toISOString() || null,
            createdAt: c.createdAt.toISOString(),
        })),
        calls: calls.map((c) => ({
            ...c,
            calledAt: c.calledAt.toISOString(),
        })),
        templates: templates.map((t) => ({
            ...t,
            createdAt: t.createdAt.toISOString(),
        })),
        summary: {
            totalLeads: leads.length,
            totalCampaigns: campaigns.length,
            totalCalls: calls.length,
            totalTemplates: templates.length,
        },
    }

    return exportData
}

// ==================== BUSCAR USUÁRIOS (para transfer) ====================

export async function searchUsersForTransfer(search: string) {
    await requireAdmin()

    if (!search || search.length < 2) return []

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { email: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
            ],
            status: "ACTIVE",
        },
        take: 10,
        select: {
            id: true,
            name: true,
            email: true,
        },
    })

    return users
}
