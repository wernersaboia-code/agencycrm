// app/super-admin/page.tsx.bak

import { Suspense } from "react"
import Link from "next/link"
import {
    Activity,
    AlertCircle,
    Users,
    Building2,
    Mail,
    Phone,
    Package,
    ShoppingCart,
    DollarSign,
    ArrowRight,
    ListPlus,
    Store,
    UserCog,
    CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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

            <Suspense fallback={<PanelSkeleton />}>
                <GlobalReadinessPanel />
            </Suspense>

            <div className="grid gap-6 md:grid-cols-2">
                <Suspense fallback={<PanelSkeleton />}>
                    <OperationsPanel />
                </Suspense>

                <QuickActions />
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

async function GlobalReadinessPanel() {
    const stats = await getGlobalStats()
    const activeUserRate = stats.totalUsers > 0
        ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
        : 0
    const callAnswerRate = stats.totalCalls > 0
        ? Math.round((stats.callsAnswered / stats.totalCalls) * 100)
        : 0
    const checks = [
        {
            title: "Base de usuários",
            description: `${activeUserRate}% dos usuários estão ativos`,
            href: "/super-admin/users",
            done: stats.totalUsers > 0 && activeUserRate >= 70,
            value: `${stats.activeUsers}/${stats.totalUsers}`,
        },
        {
            title: "Catálogo marketplace",
            description: `${stats.totalLists} listas ativas com ${stats.totalLeadsMarketplace.toLocaleString()} leads`,
            href: "/super-admin/marketplace/lists",
            done: stats.totalLists > 0 && stats.totalLeadsMarketplace > 0,
            value: stats.totalLists,
        },
        {
            title: "Receita do mês",
            description: `${stats.purchasesThisMonth} venda${stats.purchasesThisMonth !== 1 ? "s" : ""} paga${stats.purchasesThisMonth !== 1 ? "s" : ""}`,
            href: "/super-admin/marketplace/purchases",
            done: stats.revenueThisMonth > 0,
            value: `€${stats.revenueThisMonth.toLocaleString()}`,
        },
        {
            title: "Engajamento CRM",
            description: `${stats.openRate}% abertura, ${callAnswerRate}% atendimento`,
            href: "/super-admin/workspaces",
            done: stats.emailsSent > 0 || stats.totalCalls > 0,
            value: stats.emailsSent.toLocaleString(),
        },
    ]
    const completedChecks = checks.filter((check) => check.done).length
    const readiness = Math.round((completedChecks / checks.length) * 100)

    return (
        <Card className={readiness >= 75 ? "border-emerald-300 dark:border-emerald-900" : "border-amber-300 dark:border-amber-900"}>
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Saúde da operação
                        </CardTitle>
                        <Badge variant={readiness >= 75 ? "default" : "outline"}>
                            {completedChecks}/{checks.length} em dia
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Sinais rápidos para priorizar suporte, catálogo, receita e adoção do CRM.
                    </p>
                </div>
                <div className="w-full space-y-2 lg:w-64">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Prontidão</span>
                        <span className="font-medium">{readiness}%</span>
                    </div>
                    <Progress value={readiness} />
                </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
                {checks.map((check) => (
                    <Link
                        key={check.title}
                        href={check.href}
                        className="flex min-h-[112px] items-start justify-between gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/50"
                    >
                        <span className="flex min-w-0 gap-3">
                            {check.done ? (
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                            ) : (
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                            )}
                            <span className="space-y-1">
                                <span className="block font-medium leading-tight">{check.title}</span>
                                <span className="block text-sm text-muted-foreground">{check.description}</span>
                            </span>
                        </span>
                        <span className="text-right text-lg font-semibold">{check.value}</span>
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}

async function OperationsPanel() {
    const stats = await getGlobalStats()

    const checks = [
        {
            title: "Usuários ativos",
            value: `${stats.activeUsers}/${stats.totalUsers}`,
            detail: `${stats.usersThisMonth} novos este mês`,
            href: "/super-admin/users",
        },
        {
            title: "Marketplace",
            value: stats.totalLists,
            detail: `${stats.totalLeadsMarketplace.toLocaleString()} leads publicados`,
            href: "/super-admin/marketplace/lists",
        },
        {
            title: "Receita do mês",
            value: `€${stats.revenueThisMonth.toLocaleString()}`,
            detail: `${stats.purchasesThisMonth} vendas pagas`,
            href: "/super-admin/marketplace/purchases",
        },
        {
            title: "Engajamento CRM",
            value: `${stats.openRate}%`,
            detail: `${stats.emailsSent.toLocaleString()} emails nos últimos 30 dias`,
            href: "/super-admin/workspaces",
        },
    ]

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Operação</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/super-admin/marketplace">
                        Marketplace
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-3">
                {checks.map((check) => (
                    <Link
                        key={check.title}
                        href={check.href}
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                        <div>
                            <p className="font-medium">{check.title}</p>
                            <p className="text-sm text-muted-foreground">{check.detail}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold">{check.value}</p>
                            <ArrowRight className="ml-auto mt-1 h-4 w-4 text-muted-foreground" />
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}

function QuickActions() {
    const actions = [
        {
            title: "Criar lista marketplace",
            description: "Publicar uma nova lista de leads para venda",
            href: "/super-admin/marketplace/lists/new",
            icon: ListPlus,
        },
        {
            title: "Revisar usuários",
            description: "Ver contas, status e permissões",
            href: "/super-admin/users",
            icon: UserCog,
        },
        {
            title: "Acompanhar vendas",
            description: "Consultar compras e receita do marketplace",
            href: "/super-admin/marketplace/purchases",
            icon: ShoppingCart,
        },
        {
            title: "Gerenciar catálogo",
            description: "Editar listas e leads disponíveis",
            href: "/super-admin/marketplace",
            icon: Store,
        },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
                {actions.map((action) => (
                    <Link
                        key={action.href}
                        href={action.href}
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                                <action.icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">{action.title}</p>
                                <p className="text-sm text-muted-foreground">{action.description}</p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}

function PanelSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
            </CardContent>
        </Card>
    )
}
