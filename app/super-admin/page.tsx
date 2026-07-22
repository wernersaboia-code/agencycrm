import Link from "next/link"
import type { ComponentType } from "react"
import {
    ArrowRight,
    BarChart3,
    Building2,
    LifeBuoy,
    Package,
    Rocket,
    Settings,
    ShoppingCart,
    Store,
    Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getGlobalStats } from "@/actions/admin/global-stats"
import { formatCurrency } from "@/lib/utils"

export default async function SuperAdminDashboardPage() {
    const stats = await getGlobalStats()

    const mainActions = [
        {
            title: "Gerenciar listas de leads",
            description: "Criar, editar e publicar listas que aparecem no catálogo.",
            href: "/super-admin/marketplace/lists",
            icon: Package,
            tone: "primary",
        },
        {
            title: "Ver vendas",
            description: "Consultar compras realizadas, valores e pedidos dos clientes.",
            href: "/super-admin/marketplace/purchases",
            icon: ShoppingCart,
            tone: "default",
        },
        {
            title: "Gerenciar usuários",
            description: "Ver contas, status, permissões e acessos ao sistema.",
            href: "/super-admin/users",
            icon: Users,
            tone: "default",
        },
        {
            title: "Empresas e contas",
            description: "Acompanhar workspaces, responsáveis e uso do CRM.",
            href: "/super-admin/workspaces",
            icon: Building2,
            tone: "default",
        },
        {
            // Única porta de entrada do CRM: ele saiu das telas de cliente por
            // ser ferramenta interna da operação, não parte do que se vende.
            title: "Abrir o CRM",
            description: "Leads, campanhas, chamadas e relatórios da operação interna.",
            href: "/dashboard",
            icon: Rocket,
            tone: "default",
        },
    ] as const

    const metrics = [
        {
            label: "Listas ativas",
            value: stats.totalLists.toLocaleString("pt-BR"),
            detail: `${stats.totalLeadsMarketplace.toLocaleString("pt-BR")} leads publicados`,
            icon: Store,
        },
        {
            label: "Vendas pagas",
            value: stats.totalPurchases.toLocaleString("pt-BR"),
            detail: `${stats.purchasesThisMonth.toLocaleString("pt-BR")} este mês`,
            icon: ShoppingCart,
        },
        {
            label: "Receita total",
            value: formatCurrency(stats.totalRevenue, "EUR"),
            detail: `${formatCurrency(stats.revenueThisMonth, "EUR")} este mês`,
            icon: BarChart3,
        },
        {
            label: "Usuários ativos",
            value: `${stats.activeUsers}/${stats.totalUsers}`,
            detail: `${stats.usersThisMonth.toLocaleString("pt-BR")} novos este mês`,
            icon: Users,
        },
    ]

    return (
        <div className="space-y-6">
            <section className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Badge variant="outline" className="mb-3 border-indigo-200 bg-indigo-50 text-indigo-700">
                            Área Administrativa
                        </Badge>
                        <h1 className="text-3xl font-bold tracking-tight">
                            O que você quer fazer agora?
                        </h1>
                        <p className="mt-2 max-w-2xl text-muted-foreground">
                            Comece pelas tarefas principais do dia: listas, vendas, usuários e contas.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/">
                            Voltar para a página inicial
                        </Link>
                    </Button>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {mainActions.map((action) => (
                    <AdminActionCard key={action.href} {...action} />
                ))}
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                    <MetricCard key={metric.label} {...metric} />
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Resumo rápido</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                        <SummaryLink
                            title="Catálogo do marketplace"
                            description={`${stats.totalLists} listas ativas para venda`}
                            href="/super-admin/marketplace"
                            icon={Store}
                        />
                        <SummaryLink
                            title="Relatórios"
                            description="Acompanhar receita, uso e desempenho"
                            href="/super-admin/analytics"
                            icon={BarChart3}
                        />
                        <SummaryLink
                            title="Suporte"
                            description="Acessar rotinas de apoio e atendimento"
                            href="/super-admin/support"
                            icon={LifeBuoy}
                        />
                        <SummaryLink
                            title="Configurações"
                            description="Ajustar preferências da administração"
                            href="/super-admin/settings"
                            icon={Settings}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Atalhos importantes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button className="w-full justify-between bg-indigo-600 hover:bg-indigo-700" asChild>
                            <Link href="/super-admin/marketplace/lists/new">
                                Criar nova lista
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-between" asChild>
                            <Link href="/super-admin/marketplace/purchases">
                                Consultar vendas
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-between" asChild>
                            <Link href="/super-admin/users">
                                Ver usuários
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}

function AdminActionCard({
    title,
    description,
    href,
    icon: Icon,
    tone,
}: {
    title: string
    description: string
    href: string
    icon: ComponentType<{ className?: string }>
    tone: "primary" | "default"
}) {
    const isPrimary = tone === "primary"

    return (
        <Link
            href={href}
            className={`group flex min-h-52 flex-col justify-between rounded-lg border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                isPrimary
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-200 bg-white text-gray-950 hover:border-indigo-300"
            }`}
        >
            <div>
                <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-md ${
                        isPrimary ? "bg-white/15 text-white" : "bg-indigo-50 text-indigo-700"
                    }`}
                >
                    <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold leading-tight">{title}</h2>
                <p className={`mt-3 text-sm leading-6 ${isPrimary ? "text-white/85" : "text-muted-foreground"}`}>
                    {description}
                </p>
            </div>
            <div className="mt-5 flex items-center justify-between text-sm font-semibold">
                Abrir
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </div>
        </Link>
    )
}

function MetricCard({
    label,
    value,
    detail,
    icon: Icon,
}: {
    label: string
    value: string
    detail: string
    icon: ComponentType<{ className?: string }>
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="truncate text-2xl font-bold">{value}</p>
                    <p className="truncate text-xs text-muted-foreground">{detail}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function SummaryLink({
    title,
    description,
    href,
    icon: Icon,
}: {
    title: string
    description: string
    href: string
    icon: ComponentType<{ className?: string }>
}) {
    return (
        <Link
            href={href}
            className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
        </Link>
    )
}
