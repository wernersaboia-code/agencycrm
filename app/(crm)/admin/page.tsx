// app/(crm)/admin/page.tsx
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Package,
    Users,
    ShoppingCart,
    TrendingUp,
    ArrowRight
} from "lucide-react"

export default async function AdminPage() {
    const [listsCount, leadsCount, purchasesCount, revenue] = await Promise.all([
        prisma.leadList.count(),
        prisma.marketplaceLead.count(),
        prisma.purchase.count({ where: { status: "paid" } }),
        prisma.purchase.aggregate({
            where: { status: "paid" },
            _sum: { total: true }
        })
    ])

    const stats = [
        {
            title: "Listas",
            value: listsCount,
            icon: Package,
            href: "/admin/lists"
        },
        {
            title: "Leads no Marketplace",
            value: leadsCount.toLocaleString(),
            icon: Users,
            href: "/admin/lists"
        },
        {
            title: "Vendas",
            value: purchasesCount,
            icon: ShoppingCart,
            href: "/admin/purchases"
        },
        {
            title: "Receita Total",
            value: `€${Number(revenue._sum.total || 0).toLocaleString()}`,
            icon: TrendingUp,
            href: "/admin/purchases"
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Admin - Marketplace</h1>
                    <p className="text-muted-foreground">
                        Gerencie as listas de leads do marketplace
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/lists/new">
                        <Package className="h-4 w-4 mr-2" />
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
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <Link
                        href="/admin/lists/new"
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-emerald-600" />
                            <div>
                                <p className="font-medium">Criar Nova Lista</p>
                                <p className="text-sm text-muted-foreground">
                                    Adicione uma nova lista ao catálogo
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                        href="/admin/lists"
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="font-medium">Gerenciar Listas</p>
                                <p className="text-sm text-muted-foreground">
                                    Edite listas e adicione leads
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}