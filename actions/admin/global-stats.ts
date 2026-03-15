// actions/admin/global-stats.ts

"use server"

import { prisma } from "@/lib/prisma"
import { startOfMonth, subDays } from "date-fns"

export interface GlobalStats {
    // Usuários
    totalUsers: number
    activeUsers: number
    usersThisMonth: number

    // Workspaces
    totalWorkspaces: number
    workspacesThisMonth: number

    // Leads CRM
    totalLeadsCRM: number
    leadsThisMonth: number

    // Leads Marketplace
    totalLeadsMarketplace: number
    totalLists: number

    // Campanhas (últimos 30 dias)
    campaignsSent: number
    emailsSent: number
    emailsOpened: number
    openRate: number

    // Ligações (últimos 30 dias)
    totalCalls: number
    callsAnswered: number

    // Vendas
    totalPurchases: number
    purchasesThisMonth: number
    totalRevenue: number
    revenueThisMonth: number
}

export async function getGlobalStats(): Promise<GlobalStats> {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const startOfCurrentMonth = startOfMonth(now)

    // Executar todas as queries em paralelo
    const [
        // Usuários
        totalUsers,
        activeUsers,
        usersThisMonth,

        // Workspaces
        totalWorkspaces,
        workspacesThisMonth,

        // Leads CRM
        totalLeadsCRM,
        leadsThisMonth,

        // Leads Marketplace
        totalLeadsMarketplace,
        totalLists,

        // Campanhas
        campaignsSent,
        emailStats,

        // Ligações
        callStats,

        // Vendas
        purchaseStats,
        purchasesThisMonth,
        revenueStats,
        revenueThisMonth,
    ] = await Promise.all([
        // Usuários
        prisma.user.count(),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.user.count({ where: { createdAt: { gte: startOfCurrentMonth } } }),

        // Workspaces
        prisma.workspace.count(),
        prisma.workspace.count({ where: { createdAt: { gte: startOfCurrentMonth } } }),

        // Leads CRM
        prisma.lead.count(),
        prisma.lead.count({ where: { createdAt: { gte: startOfCurrentMonth } } }),

        // Leads Marketplace
        prisma.marketplaceLead.count(),
        prisma.leadList.count({ where: { isActive: true } }),

        // Campanhas (últimos 30 dias)
        prisma.campaign.count({
            where: {
                status: "SENT",
                sentAt: { gte: thirtyDaysAgo }
            }
        }),
        prisma.emailSend.aggregate({
            where: { sentAt: { gte: thirtyDaysAgo } },
            _count: { id: true },
            _sum: { openCount: true }
        }),

        // Ligações (últimos 30 dias)
        prisma.call.groupBy({
            by: ["result"],
            where: { calledAt: { gte: thirtyDaysAgo } },
            _count: { id: true }
        }),

        // Vendas
        prisma.purchase.count({ where: { status: "paid" } }),
        prisma.purchase.count({
            where: {
                status: "paid",
                paidAt: { gte: startOfCurrentMonth }
            }
        }),
        prisma.purchase.aggregate({
            where: { status: "paid" },
            _sum: { total: true }
        }),
        prisma.purchase.aggregate({
            where: {
                status: "paid",
                paidAt: { gte: startOfCurrentMonth }
            },
            _sum: { total: true }
        }),
    ])

    // Calcular métricas de ligações
    const totalCalls = callStats.reduce((acc, curr) => acc + curr._count.id, 0)
    const answeredResults = ["ANSWERED", "INTERESTED", "NOT_INTERESTED", "CALLBACK", "MEETING_SCHEDULED"]
    const callsAnswered = callStats
        .filter(c => answeredResults.includes(c.result))
        .reduce((acc, curr) => acc + curr._count.id, 0)

    // Calcular métricas de email
    const emailsSent = emailStats._count.id || 0
    const emailsOpened = emailStats._sum.openCount || 0
    const openRate = emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0

    return {
        // Usuários
        totalUsers,
        activeUsers,
        usersThisMonth,

        // Workspaces
        totalWorkspaces,
        workspacesThisMonth,

        // Leads CRM
        totalLeadsCRM,
        leadsThisMonth,

        // Leads Marketplace
        totalLeadsMarketplace,
        totalLists,

        // Campanhas
        campaignsSent,
        emailsSent,
        emailsOpened,
        openRate,

        // Ligações
        totalCalls,
        callsAnswered,

        // Vendas
        totalPurchases: purchaseStats,
        purchasesThisMonth,
        totalRevenue: Number(revenueStats._sum.total || 0),
        revenueThisMonth: Number(revenueThisMonth._sum.total || 0),
    }
}