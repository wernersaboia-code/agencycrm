// app/super-admin/marketplace/page.tsx.bak
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    AlertCircle,
    Package,
    Users,
    ShoppingCart,
    TrendingUp,
    ArrowRight,
    Plus,
    CheckCircle2,
    Store,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default async function MarketplacePage() {
    const [listsCount, leadsCount, purchasesCount, revenue, recentLists] = await Promise.all([
        prisma.leadList.count(),
        prisma.marketplaceLead.count(),
        prisma.purchase.count({ where: { status: "paid" } }),
        prisma.purchase.aggregate({
            where: { status: "paid" },
            _sum: { total: true }
        }),
        prisma.leadList.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { leads: true, purchaseItems: true } }
            }
        })
    ])

    const stats = [
        {
            title: "Listas Ativas",
            value: listsCount,
            icon: Package,
            href: "/super-admin/marketplace/lists",
            color: "text-violet-600"
        },
        {
            title: "Leads no Marketplace",
            value: leadsCount.toLocaleString(),
            icon: Users,
            href: "/super-admin/marketplace/lists",
            color: "text-blue-600"
        },
        {
            title: "Vendas Realizadas",
            value: purchasesCount,
            icon: ShoppingCart,
            href: "/super-admin/marketplace/purchases",
            color: "text-green-600"
        },
        {
            title: "Receita Total",
            value: formatCurrency(Number(revenue._sum.total || 0), "EUR"),
            icon: TrendingUp,
            href: "/super-admin/marketplace/purchases",
            color: "text-amber-600"
        },
    ]
    const publishedLists = recentLists.filter((list) => list.isActive && list._count.leads > 0).length
    const emptyRecentLists = recentLists.filter((list) => list._count.leads === 0).length
    const marketplaceChecks = [
        {
            title: "Listas publicadas",
            description: listsCount > 0
                ? `${listsCount} lista${listsCount !== 1 ? "s" : ""} no catálogo`
                : "Crie a primeira lista para iniciar o catálogo.",
            href: "/super-admin/marketplace/lists",
            done: listsCount > 0,
            value: listsCount,
        },
        {
            title: "Estoque de leads",
            description: leadsCount > 0
                ? `${leadsCount.toLocaleString()} lead${leadsCount !== 1 ? "s" : ""} disponíveis`
                : "Adicione leads às listas antes de vender.",
            href: "/super-admin/marketplace/lists",
            done: leadsCount > 0,
            value: leadsCount.toLocaleString(),
        },
        {
            title: "Vendas pagas",
            description: purchasesCount > 0
                ? `${purchasesCount} compra${purchasesCount !== 1 ? "s" : ""} concluída${purchasesCount !== 1 ? "s" : ""}`
                : "Nenhuma compra paga registrada ainda.",
            href: "/super-admin/marketplace/purchases",
            done: purchasesCount > 0,
            value: purchasesCount,
        },
    ]
    const completedChecks = marketplaceChecks.filter((check) => check.done).length
    const readiness = Math.round((completedChecks / marketplaceChecks.length) * 100)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Marketplace</h1>
                    <p className="text-muted-foreground">
                        Gerencie listas de leads e acompanhe vendas
                    </p>
                </div>
                <Button asChild>
                    <Link href="/super-admin/marketplace/lists/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Lista
                    </Link>
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Link key={stat.title} href={stat.href}>
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <Card className={readiness >= 67 ? "border-emerald-300 dark:border-emerald-900" : "border-amber-300 dark:border-amber-900"}>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5" />
                                Prontidão do marketplace
                            </CardTitle>
                            <Badge variant={readiness >= 67 ? "default" : "outline"}>
                                {completedChecks}/{marketplaceChecks.length} completo
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {publishedLists} lista{publishedLists !== 1 ? "s" : ""} recente{publishedLists !== 1 ? "s" : ""} com leads.
                            {emptyRecentLists > 0 ? ` ${emptyRecentLists} recente${emptyRecentLists !== 1 ? "s" : ""} ainda sem leads.` : " Nenhuma lista recente vazia."}
                        </p>
                    </div>
                    <div className="w-full space-y-2 lg:w-64">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Cobertura</span>
                            <span className="font-medium">{readiness}%</span>
                        </div>
                        <Progress value={readiness} />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                    {marketplaceChecks.map((check) => (
                        <Link
                            key={check.title}
                            href={check.href}
                            className="flex min-h-[104px] items-start justify-between gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/50"
                        >
                            <span className="flex min-w-0 gap-3">
                                {check.done ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                ) : (
                                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                )}
                                <span>
                                    <span className="block font-medium">{check.title}</span>
                                    <span className="block text-sm text-muted-foreground">{check.description}</span>
                                </span>
                            </span>
                            <span className="text-xl font-semibold">{check.value}</span>
                        </Link>
                    ))}
                </CardContent>
            </Card>

            {/* Quick Actions + Recent Lists */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ações Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Link
                            href="/super-admin/marketplace/lists/new"
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                    <Package className="h-5 w-5 text-violet-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Criar Nova Lista</p>
                                    <p className="text-sm text-muted-foreground">
                                        Adicione uma nova lista ao catálogo
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>

                        <Link
                            href="/super-admin/marketplace/lists"
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Gerenciar Listas</p>
                                    <p className="text-sm text-muted-foreground">
                                        Edite listas e adicione leads
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>

                        <Link
                            href="/super-admin/marketplace/purchases"
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <ShoppingCart className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Ver Vendas</p>
                                    <p className="text-sm text-muted-foreground">
                                        Acompanhe todas as compras realizadas
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                    </CardContent>
                </Card>

                {/* Recent Lists */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Listas Recentes</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/super-admin/marketplace/lists">
                                Ver todas
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentLists.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Nenhuma lista criada ainda
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {recentLists.map((list) => (
                                    <Link
                                        key={list.id}
                                        href={`/super-admin/marketplace/lists/${list.id}`}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium">{list.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {list._count.leads.toLocaleString()} leads • {list._count.purchaseItems} vendas
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium">
                                            {formatCurrency(Number(list.price), list.currency)}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
