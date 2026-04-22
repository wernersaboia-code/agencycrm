// app/super-admin/page.tsx.bak

import { Suspense } from "react"
import {
    Users,
    Building2,
    Mail,
    Phone,
    TrendingUp,
    Package,
    ShoppingCart,
    DollarSign
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getGlobalStats } from "@/actions/admin/global-stats"

export default async function SuperAdminDashboardPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Dashboard Global</h1>
                <p className="text-muted-foreground">
                    Visão geral de todo o sistema
                </p>
            </div>

            {/* Stats */}
            <Suspense fallback={<StatsGridSkeleton />}>
                <GlobalStatsGrid />
            </Suspense>

            {/* Seções adicionais podem vir aqui */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Atividade Recente */}
                <Card>
                    <CardHeader>
                        <CardTitle>Atividade Recente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Em breve: logs de atividade do sistema
                        </p>
                    </CardContent>
                </Card>

                {/* Ações Rápidas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ações Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Em breve: atalhos para ações comuns
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Componente que busca e renderiza os stats
async function GlobalStatsGrid() {
    const stats = await getGlobalStats()

    const cards = [
        {
            title: "Usuários",
            value: stats.totalUsers,
            subtitle: `${stats.activeUsers} ativos`,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50 dark:bg-blue-950/30",
        },
        {
            title: "Workspaces",
            value: stats.totalWorkspaces,
            subtitle: `${stats.workspacesThisMonth} este mês`,
            icon: Building2,
            color: "text-purple-600",
            bgColor: "bg-purple-50 dark:bg-purple-950/30",
        },
        {
            title: "Leads (CRM)",
            value: stats.totalLeadsCRM.toLocaleString(),
            subtitle: `${stats.leadsThisMonth} este mês`,
            icon: Users,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        },
        {
            title: "Leads (Marketplace)",
            value: stats.totalLeadsMarketplace.toLocaleString(),
            subtitle: `em ${stats.totalLists} listas`,
            icon: Package,
            color: "text-amber-600",
            bgColor: "bg-amber-50 dark:bg-amber-950/30",
        },
        {
            title: "Campanhas (30d)",
            value: stats.campaignsSent,
            subtitle: `${stats.emailsSent.toLocaleString()} emails`,
            icon: Mail,
            color: "text-indigo-600",
            bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
        },
        {
            title: "Ligações (30d)",
            value: stats.totalCalls,
            subtitle: `${stats.callsAnswered} atendidas`,
            icon: Phone,
            color: "text-cyan-600",
            bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
        },
        {
            title: "Vendas (Marketplace)",
            value: stats.totalPurchases,
            subtitle: `${stats.purchasesThisMonth} este mês`,
            icon: ShoppingCart,
            color: "text-pink-600",
            bgColor: "bg-pink-50 dark:bg-pink-950/30",
        },
        {
            title: "Receita Total",
            value: `€${stats.totalRevenue.toLocaleString()}`,
            subtitle: `€${stats.revenueThisMonth.toLocaleString()} este mês`,
            icon: DollarSign,
            color: "text-green-600",
            bgColor: "bg-green-50 dark:bg-green-950/30",
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <Card key={card.title} className={card.bgColor}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        <card.icon className={`h-4 w-4 ${card.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {card.subtitle}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

// Skeleton para loading
function StatsGridSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-1" />
                        <Skeleton className="h-3 w-24" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}