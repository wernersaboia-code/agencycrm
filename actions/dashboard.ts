// actions/dashboard.ts

"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

// ==================== HELPERS ====================

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error("Não autenticado")
    }

    return user
}

// ==================== TIPOS ====================

export type DashboardStats = {
    // Deals
    pipelineTotal: number
    pipelineCount: number
    wonThisMonth: number
    wonThisMonthCount: number
    lostThisMonth: number
    lostThisMonthCount: number

    // Tarefas
    pendingTasks: number
    overdueTasks: number

    // Contatos e Empresas
    totalContacts: number
    totalCompanies: number
}

export type DealsByStage = {
    stage: string
    count: number
    value: number
    color: string
}

export type DealsOverTime = {
    month: string
    won: number
    lost: number
    wonValue: number
    lostValue: number
}

export type UpcomingTask = {
    id: string
    title: string
    dueDate: string | null
    priority: string
    status: string
    contact: { firstName: string; lastName: string } | null
    company: { name: string } | null
}

export type RecentDeal = {
    id: string
    title: string
    value: number | null
    status: string
    stage: { name: string; color: string } | null
    contact: { firstName: string; lastName: string } | null
    company: { name: string } | null
    createdAt: string
}

// ==================== FUNÇÕES ====================

export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    try {
        const user = await getAuthenticatedUser()

        // Datas para filtros do mês atual
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Buscar todas as métricas em paralelo
        const [
            // Deals em aberto (pipeline)
            pipelineDeals,
            // Deals ganhos no mês
            wonDeals,
            // Deals perdidos no mês
            lostDeals,
            // Tarefas pendentes
            pendingTasks,
            // Tarefas atrasadas
            overdueTasks,
            // Total de contatos
            totalContacts,
            // Total de empresas
            totalCompanies,
        ] = await Promise.all([
            // Pipeline (deals abertos)
            prisma.deal.findMany({
                where: {
                    assignedToId: user.id,
                    status: "OPEN",
                },
                select: { value: true },
            }),

            // Ganhos no mês
            prisma.deal.findMany({
                where: {
                    assignedToId: user.id,
                    status: "WON",
                    closedAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                select: { value: true },
            }),

            // Perdidos no mês
            prisma.deal.findMany({
                where: {
                    assignedToId: user.id,
                    status: "LOST",
                    closedAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                select: { value: true },
            }),

            // Tarefas pendentes
            prisma.task.count({
                where: {
                    createdById: user.id,
                    status: { in: ["TODO", "IN_PROGRESS"] },
                },
            }),

            // Tarefas atrasadas
            prisma.task.count({
                where: {
                    createdById: user.id,
                    status: { in: ["TODO", "IN_PROGRESS"] },
                    dueDate: { lt: today },
                },
            }),

            // Contatos
            prisma.contact.count({
                where: {
                    OR: [
                        { createdById: user.id },
                        { assignedToId: user.id },
                    ],
                },
            }),

            // Empresas
            prisma.company.count({
                where: { assignedToId: user.id },
            }),
        ])

        // Calcular totais
        const pipelineTotal = pipelineDeals.reduce((sum: number, d) => sum + (d.value ? Number(d.value) : 0), 0)
        const wonTotal = wonDeals.reduce((sum: number, d) => sum + (d.value ? Number(d.value) : 0), 0)
        const lostTotal = lostDeals.reduce((sum: number, d) => sum + (d.value ? Number(d.value) : 0), 0)

        return {
            success: true,
            data: {
                pipelineTotal,
                pipelineCount: pipelineDeals.length,
                wonThisMonth: wonTotal,
                wonThisMonthCount: wonDeals.length,
                lostThisMonth: lostTotal,
                lostThisMonthCount: lostDeals.length,
                pendingTasks,
                overdueTasks,
                totalContacts,
                totalCompanies,
            },
        }
    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
        return { success: false, error: "Erro ao buscar estatísticas" }
    }
}

export async function getDealsByStage(): Promise<{ success: boolean; data?: DealsByStage[]; error?: string }> {
    try {
        const user = await getAuthenticatedUser()

        // Buscar estágios com deals
        const stages = await prisma.pipelineStage.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
            include: {
                deals: {
                    where: {
                        assignedToId: user.id,
                        status: "OPEN",
                    },
                    select: { value: true },
                },
            },
        })

        const data: DealsByStage[] = stages.map((stage) => ({
            stage: stage.name,
            count: stage.deals.length,
            value: stage.deals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0),
            color: stage.color,
        }))

        return { success: true, data }
    } catch (error) {
        console.error("Erro ao buscar deals por estágio:", error)
        return { success: false, error: "Erro ao buscar dados" }
    }
}

export async function getDealsOverTime(): Promise<{ success: boolean; data?: DealsOverTime[]; error?: string }> {
    try {
        const user = await getAuthenticatedUser()

        // Últimos 6 meses
        const months: DealsOverTime[] = []
        const now = new Date()

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

            const monthName = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")

            // Buscar deals ganhos e perdidos no mês
            const [wonDeals, lostDeals] = await Promise.all([
                prisma.deal.findMany({
                    where: {
                        assignedToId: user.id,
                        status: "WON",
                        closedAt: { gte: startOfMonth, lte: endOfMonth },
                    },
                    select: { value: true },
                }),
                prisma.deal.findMany({
                    where: {
                        assignedToId: user.id,
                        status: "LOST",
                        closedAt: { gte: startOfMonth, lte: endOfMonth },
                    },
                    select: { value: true },
                }),
            ])

            months.push({
                month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                won: wonDeals.length,
                lost: lostDeals.length,
                wonValue: wonDeals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0),
                lostValue: lostDeals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0),
            })
        }

        return { success: true, data: months }
    } catch (error) {
        console.error("Erro ao buscar deals ao longo do tempo:", error)
        return { success: false, error: "Erro ao buscar dados" }
    }
}

export async function getUpcomingTasks(): Promise<{ success: boolean; data?: UpcomingTask[]; error?: string }> {
    try {
        const user = await getAuthenticatedUser()

        const tasks = await prisma.task.findMany({
            where: {
                createdById: user.id,
                status: { in: ["TODO", "IN_PROGRESS"] },
            },
            orderBy: [
                { dueDate: "asc" },
                { priority: "desc" },
            ],
            take: 5,
            select: {
                id: true,
                title: true,
                dueDate: true,
                priority: true,
                status: true,
                contact: {
                    select: { firstName: true, lastName: true },
                },
                company: {
                    select: { name: true },
                },
            },
        })

        const data: UpcomingTask[] = tasks.map((task) => ({
            ...task,
            dueDate: task.dueDate?.toISOString() || null,
        }))

        return { success: true, data }
    } catch (error) {
        console.error("Erro ao buscar próximas tarefas:", error)
        return { success: false, error: "Erro ao buscar tarefas" }
    }
}

export async function getRecentDeals(): Promise<{ success: boolean; data?: RecentDeal[]; error?: string }> {
    try {
        const user = await getAuthenticatedUser()

        const deals = await prisma.deal.findMany({
            where: { assignedToId: user.id },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                title: true,
                value: true,
                status: true,
                createdAt: true,
                stage: {
                    select: { name: true, color: true },
                },
                contact: {
                    select: { firstName: true, lastName: true },
                },
                company: {
                    select: { name: true },
                },
            },
        })

        const data: RecentDeal[] = deals.map((deal) => ({
            ...deal,
            value: deal.value ? Number(deal.value) : null,
            createdAt: deal.createdAt.toISOString(),
        }))

        return { success: true, data }
    } catch (error) {
        console.error("Erro ao buscar deals recentes:", error)
        return { success: false, error: "Erro ao buscar deals" }
    }
}