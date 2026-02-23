// actions/dashboard.ts
"use server"

import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import { subDays, startOfDay, endOfDay } from "date-fns"

// ============================================================
// TIPOS
// ============================================================

export interface DashboardStats {
    // Leads
    totalLeads: number
    newLeadsToday: number
    newLeadsWeek: number

    // Campanhas
    totalCampaigns: number
    activeCampaigns: number

    // Emails
    totalEmailsSent: number
    totalOpens: number
    totalClicks: number
    openRate: number
    clickRate: number

    // Ligações
    totalCalls: number
    answeredCalls: number
    answerRate: number
    positiveResults: number
    positiveRate: number
}

export interface CampaignSummary {
    id: string
    name: string
    status: string
    sentCount: number
    openCount: number
    clickCount: number
    openRate: number
    createdAt: string
}

export interface RecentLead {
    id: string
    firstName: string
    lastName: string | null
    email: string
    company: string | null
    status: string
    createdAt: string
}

export interface EmailsOverTime {
    date: string
    sent: number
    opened: number
    clicked: number
}

export interface PendingCallback {
    id: string
    leadName: string
    leadCompany: string | null
    followUpAt: string
    notes: string | null
    isOverdue: boolean
    isToday: boolean
}

export interface CallbacksSummary {
    overdue: PendingCallback[]
    today: PendingCallback[]
    thisWeek: PendingCallback[]
    overdueCount: number
    todayCount: number
    thisWeekCount: number
}

// ============================================================
// FUNÇÕES
// ============================================================

export async function getDashboardStats(
    workspaceId: string
): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        // Verificar acesso ao workspace
        const workspace = await prisma.workspace.findFirst({
            where: { id: workspaceId, userId: user.id },
        })

        if (!workspace) {
            return { success: false, error: "Workspace não encontrado" }
        }

        const now = new Date()
        const todayStart = startOfDay(now)
        const weekAgo = subDays(now, 7)

        // Buscar todas as métricas em paralelo
        const [
            totalLeads,
            newLeadsToday,
            newLeadsWeek,
            totalCampaigns,
            activeCampaigns,
            emailStats,
            callStats,
        ] = await Promise.all([
            // Total de leads
            prisma.lead.count({
                where: { workspaceId },
            }),

            // Leads hoje
            prisma.lead.count({
                where: {
                    workspaceId,
                    createdAt: { gte: todayStart },
                },
            }),

            // Leads na semana
            prisma.lead.count({
                where: {
                    workspaceId,
                    createdAt: { gte: weekAgo },
                },
            }),

            // Total de campanhas
            prisma.campaign.count({
                where: { workspaceId },
            }),

            // Campanhas ativas (SENDING ou SCHEDULED)
            prisma.campaign.count({
                where: {
                    workspaceId,
                    status: { in: ["SENDING", "SCHEDULED"] },
                },
            }),

            // Estatísticas de email
            prisma.emailSend.aggregate({
                where: {
                    campaign: { workspaceId },
                },
                _count: { id: true },
                _sum: {
                    openCount: true,
                    clickCount: true,
                },
            }),

            // Estatísticas de ligações
            prisma.call.groupBy({
                by: ["result"],
                where: { workspaceId },
                _count: { id: true },
            }),
        ])

        // Calcular métricas de email
        const totalEmailsSent = emailStats._count.id || 0
        const totalOpens = emailStats._sum.openCount || 0
        const totalClicks = emailStats._sum.clickCount || 0
        const openRate = totalEmailsSent > 0 ? (totalOpens / totalEmailsSent) * 100 : 0
        const clickRate = totalEmailsSent > 0 ? (totalClicks / totalEmailsSent) * 100 : 0

        // Calcular métricas de ligações
        const totalCalls = callStats.reduce((sum, c) => sum + c._count.id, 0)
        const answeredCalls = callStats
            .filter((c) => c.result === "ANSWERED")
            .reduce((sum, c) => sum + c._count.id, 0)
        const positiveResults = callStats
            .filter((c) => ["INTERESTED", "MEETING_SCHEDULED"].includes(c.result))
            .reduce((sum, c) => sum + c._count.id, 0)

        const answerRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0
        const positiveRate = totalCalls > 0 ? (positiveResults / totalCalls) * 100 : 0

        return {
            success: true,
            data: {
                totalLeads,
                newLeadsToday,
                newLeadsWeek,
                totalCampaigns,
                activeCampaigns,
                totalEmailsSent,
                totalOpens,
                totalClicks,
                openRate: Math.round(openRate * 10) / 10,
                clickRate: Math.round(clickRate * 10) / 10,
                totalCalls,
                answeredCalls,
                answerRate: Math.round(answerRate * 10) / 10,
                positiveResults,
                positiveRate: Math.round(positiveRate * 10) / 10,
            },
        }
    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
        return { success: false, error: "Erro ao buscar estatísticas" }
    }
}

export async function getRecentCampaigns(
    workspaceId: string,
    limit: number = 5
): Promise<{ success: boolean; data?: CampaignSummary[]; error?: string }> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const campaigns = await prisma.campaign.findMany({
            where: {
                workspaceId,
                workspace: { userId: user.id },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                name: true,
                status: true,
                totalSent: true,      // ← Era sentCount
                totalOpened: true,    // ← Era openCount
                totalClicked: true,   // ← Era clickCount
                createdAt: true,
            },
        })

        const data: CampaignSummary[] = campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            sentCount: c.totalSent,      // ← Mapeia para o nome do tipo
            openCount: c.totalOpened,    // ← Mapeia para o nome do tipo
            clickCount: c.totalClicked,  // ← Mapeia para o nome do tipo
            openRate: c.totalSent > 0 ? Math.round((c.totalOpened / c.totalSent) * 100) : 0,
            createdAt: c.createdAt.toISOString(),
        }))

        return { success: true, data }
    } catch (error) {
        console.error("Erro ao buscar campanhas:", error)
        return { success: false, error: "Erro ao buscar campanhas" }
    }
}

export async function getRecentLeads(
    workspaceId: string,
    limit: number = 5
): Promise<{ success: boolean; data?: RecentLead[]; error?: string }> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const leads = await prisma.lead.findMany({
            where: {
                workspaceId,
                workspace: { userId: user.id },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                status: true,
                createdAt: true,
            },
        })

        const data: RecentLead[] = leads.map((l) => ({
            ...l,
            createdAt: l.createdAt.toISOString(),
        }))

        return { success: true, data }
    } catch (error) {
        console.error("Erro ao buscar leads:", error)
        return { success: false, error: "Erro ao buscar leads" }
    }
}

export async function getEmailsOverTime(
    workspaceId: string,
    days: number = 7
): Promise<{ success: boolean; data?: EmailsOverTime[]; error?: string }> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const results: EmailsOverTime[] = []
        const now = new Date()

        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(now, i)
            const dayStart = startOfDay(date)
            const dayEnd = endOfDay(date)

            const stats = await prisma.emailSend.aggregate({
                where: {
                    campaign: { workspaceId },
                    sentAt: {
                        gte: dayStart,
                        lte: dayEnd,
                    },
                },
                _count: { id: true },
                _sum: {
                    openCount: true,
                    clickCount: true,
                },
            })

            results.push({
                date: date.toISOString().split("T")[0],
                sent: stats._count.id || 0,
                opened: stats._sum.openCount || 0,
                clicked: stats._sum.clickCount || 0,
            })
        }

        return { success: true, data: results }
    } catch (error) {
        console.error("Erro ao buscar emails:", error)
        return { success: false, error: "Erro ao buscar dados" }
    }
}

export async function getDashboardCallbacks(
    workspaceId: string
): Promise<{ success: boolean; data?: CallbacksSummary; error?: string }> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const now = new Date()
        const todayStart = startOfDay(now)
        const todayEnd = endOfDay(now)
        const weekEnd = endOfDay(subDays(now, -7))

        const callbacks = await prisma.call.findMany({
            where: {
                workspaceId,
                workspace: { userId: user.id },
                followUpAt: { not: null },
            },
            orderBy: { followUpAt: "asc" },
            include: {
                lead: {
                    select: {
                        firstName: true,
                        lastName: true,
                        company: true,
                    },
                },
            },
        })

        const mapCallback = (call: any): PendingCallback => ({
            id: call.id,
            leadName: `${call.lead.firstName} ${call.lead.lastName || ""}`.trim(),
            leadCompany: call.lead.company,
            followUpAt: call.followUpAt!.toISOString(),
            notes: call.notes,
            isOverdue: call.followUpAt < todayStart,
            isToday: call.followUpAt >= todayStart && call.followUpAt <= todayEnd,
        })

        const overdue = callbacks
            .filter((c) => c.followUpAt! < todayStart)
            .map(mapCallback)
            .slice(0, 5)

        const today = callbacks
            .filter((c) => c.followUpAt! >= todayStart && c.followUpAt! <= todayEnd)
            .map(mapCallback)
            .slice(0, 5)

        const thisWeek = callbacks
            .filter((c) => c.followUpAt! > todayEnd && c.followUpAt! <= weekEnd)
            .map(mapCallback)
            .slice(0, 5)

        return {
            success: true,
            data: {
                overdue,
                today,
                thisWeek,
                overdueCount: callbacks.filter((c) => c.followUpAt! < todayStart).length,
                todayCount: callbacks.filter(
                    (c) => c.followUpAt! >= todayStart && c.followUpAt! <= todayEnd
                ).length,
                thisWeekCount: callbacks.filter(
                    (c) => c.followUpAt! > todayEnd && c.followUpAt! <= weekEnd
                ).length,
            },
        }
    } catch (error) {
        console.error("Erro ao buscar callbacks:", error)
        return { success: false, error: "Erro ao buscar callbacks" }
    }
}