// app/super-admin/marketplace/purchases/page.tsx
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ShoppingCart, DollarSign, TrendingUp, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function PurchasesPage() {
    const [purchases, stats] = await Promise.all([
        prisma.purchase.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: { name: true, email: true }
                },
                items: {
                    include: {
                        list: {
                            select: { name: true }
                        }
                    }
                }
            },
            take: 100
        }),
        prisma.purchase.aggregate({
            _count: true,
            _sum: { total: true },
            where: { status: "paid" }
        })
    ])

    const pendingCount = await prisma.purchase.count({
        where: { status: "pending" }
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Vendas</h1>
                <p className="text-muted-foreground">
                    Acompanhe todas as compras do marketplace
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{stats._count}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            {formatCurrency(Number(stats._sum.total || 0), "EUR")}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            {formatCurrency(
                                stats._count > 0
                                    ? Number(stats._sum.total || 0) / stats._count
                                    : 0,
                                "EUR"
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{pendingCount}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Compras</CardTitle>
                </CardHeader>
                <CardContent>
                    {purchases.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">Nenhuma venda ainda</h3>
                            <p className="text-muted-foreground">
                                As compras aparecerão aqui quando clientes comprarem listas
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Listas</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchases.map((purchase) => (
                                    <TableRow key={purchase.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">
                                                    {format(purchase.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(purchase.createdAt, "HH:mm", { locale: ptBR })}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{purchase.user.name || "—"}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {purchase.user.email}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {purchase.items.map((item) => (
                                                    <p key={item.id} className="text-sm">
                                                        {item.list.name}
                                                    </p>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(Number(purchase.total), purchase.currency)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={
                                                    purchase.status === "paid"
                                                        ? "default"
                                                        : purchase.status === "pending"
                                                            ? "secondary"
                                                            : "destructive"
                                                }
                                            >
                                                {purchase.status === "paid" && "Pago"}
                                                {purchase.status === "pending" && "Pendente"}
                                                {purchase.status === "failed" && "Falhou"}
                                                {purchase.status === "refunded" && "Reembolsado"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}