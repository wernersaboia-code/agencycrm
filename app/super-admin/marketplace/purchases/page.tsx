// app/super-admin/marketplace/purchases/page.tsx.bak
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
import { AlertCircle, CheckCircle2, ShoppingCart, DollarSign, TrendingUp, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Progress } from "@/components/ui/progress"

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
    const failedCount = purchases.filter((purchase) => purchase.status === "failed").length
    const refundedCount = purchases.filter((purchase) => purchase.status === "refunded").length
    const paidCount = purchases.filter((purchase) => purchase.status === "paid").length
    const paidRate = purchases.length > 0 ? Math.round((paidCount / purchases.length) * 100) : 0

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

            <Card className={pendingCount + failedCount + refundedCount > 0 ? "border-amber-300 dark:border-amber-900" : "border-emerald-300 dark:border-emerald-900"}>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <CardTitle>Saúde das vendas</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Acompanhe pagamentos concluídos, pendências e falhas recentes do marketplace.
                        </p>
                    </div>
                    <div className="w-full space-y-2 lg:w-64">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Pagas</span>
                            <span className="font-medium">{paidRate}%</span>
                        </div>
                        <Progress value={paidRate} />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                    {[
                        { label: "Pagas", value: paidCount, done: paidCount > 0, description: "Compras concluídas." },
                        { label: "Pendentes", value: pendingCount, done: pendingCount === 0, description: "Aguardando confirmação." },
                        { label: "Falhas", value: failedCount, done: failedCount === 0, description: "Pagamentos não concluídos." },
                        { label: "Reembolsos", value: refundedCount, done: refundedCount === 0, description: "Compras devolvidas." },
                    ].map((item) => (
                        <div key={item.label} className="flex min-h-[96px] items-start justify-between gap-3 rounded-lg border bg-background p-4">
                            <span className="flex min-w-0 gap-3">
                                {item.done ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                ) : (
                                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                )}
                                <span>
                                    <span className="block font-medium">{item.label}</span>
                                    <span className="block text-sm text-muted-foreground">{item.description}</span>
                                </span>
                            </span>
                            <span className="text-xl font-semibold">{item.value}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

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
