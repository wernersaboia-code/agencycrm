// app/super-admin/marketplace/purchases/page.tsx.bak
import { getTranslations } from "next-intl/server"
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
import { AlertCircle, ArrowLeft, CheckCircle2, ShoppingCart, DollarSign, TrendingUp, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
    const t = await getTranslations("admin.purchases")
    const tc = await getTranslations("admin.common")

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <p className="text-muted-foreground">
                        {t("subtitle")}
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/super-admin">
                        <ArrowLeft className="h-4 w-4" />
                        {tc("backToDashboard")}
                    </Link>
                </Button>
            </div>

            <Card className="border-admin-soft bg-admin-soft">
                <CardContent className="p-4 text-sm text-admin">
                    {t("infoCard")}
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t("paidSales")}</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{stats._count}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t("totalSold")}</CardTitle>
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
                        <CardTitle className="text-sm font-medium">{t("avgSale")}</CardTitle>
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
                        <CardTitle className="text-sm font-medium">{t("awaitingPayment")}</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{pendingCount}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className={pendingCount + failedCount + refundedCount > 0 ? "border-amber-300 dark:border-amber-900" : "border-admin dark:border-admin-soft"}>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <CardTitle>{t("salesHealth")}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t("salesHealthDesc")}
                        </p>
                    </div>
                    <div className="w-full space-y-2 lg:w-64">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t("paid")}</span>
                            <span className="font-medium">{paidRate}%</span>
                        </div>
                        <Progress value={paidRate} />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                    {[
                        { label: t("paid"), value: paidCount, done: paidCount > 0, description: t("paidHealthDesc") },
                        { label: t("pending"), value: pendingCount, done: pendingCount === 0, description: t("pendingHealthDesc") },
                        { label: t("failed"), value: failedCount, done: failedCount === 0, description: t("failedHealthDesc") },
                        { label: t("refunded"), value: refundedCount, done: refundedCount === 0, description: t("refundedHealthDesc") },
                    ].map((item) => (
                        <div key={item.label} className="flex min-h-[96px] items-start justify-between gap-3 rounded-lg border bg-background p-4">
                            <span className="flex min-w-0 gap-3">
                                {item.done ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-admin" />
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
                    <CardTitle>{t("purchasesMade")}</CardTitle>
                </CardHeader>
                <CardContent>
                    {purchases.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">{t("emptyTitle")}</h3>
                            <p className="text-muted-foreground">
                                {t("emptyDesc")}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("colDate")}</TableHead>
                                    <TableHead>{t("colCustomer")}</TableHead>
                                    <TableHead>{t("colLists")}</TableHead>
                                    <TableHead className="text-right">{t("colTotal")}</TableHead>
                                    <TableHead className="text-center">{t("colStatus")}</TableHead>
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
                                                {purchase.status === "paid" && t("badgePaid")}
                                                {purchase.status === "pending" && t("badgePending")}
                                                {purchase.status === "failed" && t("badgeFailed")}
                                                {purchase.status === "refunded" && t("badgeRefunded")}
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
