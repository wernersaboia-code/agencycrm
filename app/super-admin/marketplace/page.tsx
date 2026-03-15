// app/super-admin/marketplace/page.tsx
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Package,
    Users,
    ShoppingCart,
    TrendingUp,
    ArrowRight,
    Plus
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

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