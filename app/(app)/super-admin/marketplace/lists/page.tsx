// app/super-admin/marketplace/lists/page.tsx.bak
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { AlertCircle, ArrowLeft, CheckCircle2, Edit, Plus, Star, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { DeleteListButton } from "@/components/admin/delete-list-button"
import { SeedPricesDialog } from "@/components/admin/seed-prices-dialog"

export default async function MarketplaceListsPage() {
    const lists = await prisma.leadList.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: {
                    leads: true,
                    purchaseItems: true,
                },
            },
        },
    })
    const activeLists = lists.filter((list) => list.isActive).length
    const listsWithoutPdf = lists.filter((list) => !list.studyPdfUrl).length
    const featuredLists = lists.filter((list) => list.isFeatured).length
    const listsWithSales = lists.filter((list) => list._count.purchaseItems > 0).length
    const totalLeads = lists.reduce((acc, list) => acc + list._count.leads, 0)
    const totalSales = lists.reduce((acc, list) => acc + list._count.purchaseItems, 0)
    const t = await getTranslations("admin.lists")
    const tc = await getTranslations("admin.common")
    const readinessChecks = [
        {
            label: t("active"),
            value: activeLists,
            description: t("activeDesc"),
            done: activeLists > 0,
            icon: CheckCircle2,
        },
        {
            label: t("noPdf"),
            value: listsWithoutPdf,
            description: t("noPdfDesc"),
            done: listsWithoutPdf === 0 && lists.length > 0,
            icon: AlertCircle,
        },
        {
            label: t("featured"),
            value: featuredLists,
            description: t("featuredDesc"),
            done: featuredLists > 0,
            icon: Star,
        },
        {
            label: t("withSales"),
            value: listsWithSales,
            description: t("withSalesDesc", { count: totalSales }),
            done: listsWithSales > 0,
            icon: Users,
        },
    ]
    const completedReadiness = readinessChecks.filter((check) => check.done).length
    const readiness = lists.length > 0
        ? Math.round((completedReadiness / readinessChecks.length) * 100)
        : 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <p className="text-muted-foreground">
                        {t("subtitle")}
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" asChild>
                        <Link href="/super-admin">
                            <ArrowLeft className="h-4 w-4" />
                            {tc("backToDashboard")}
                        </Link>
                    </Button>
                    <SeedPricesDialog />
                    <Button className="bg-admin hover:bg-admin" asChild>
                        <Link href="/super-admin/marketplace/lists/new">
                            <Plus className="h-4 w-4" />
                            {t("createNewList")}
                        </Link>
                    </Button>
                </div>
            </div>

            <Card className="border-admin-soft bg-admin-soft">
                <CardContent className="p-4 text-sm text-admin">
                    {t("infoCard")}
                </CardContent>
            </Card>

            <Card className={readiness >= 75 ? "border-admin dark:border-admin-soft" : "border-amber-300 dark:border-amber-900"}>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <CardTitle>{t("catalogHealth")}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t("healthDesc", { count: lists.length, leads: totalLeads.toLocaleString() })}
                        </p>
                    </div>
                    <div className="w-full space-y-2 lg:w-64">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t("readiness")}</span>
                            <span className="font-medium">{readiness}%</span>
                        </div>
                        <Progress value={readiness} />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                    {readinessChecks.map((check) => (
                        <div key={check.label} className="flex min-h-[96px] items-start justify-between gap-3 rounded-lg border bg-background p-4">
                            <span className="flex min-w-0 gap-3">
                                {check.done ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-admin" />
                                ) : (
                                    <check.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                                )}
                                <span>
                                    <span className="block font-medium">{check.label}</span>
                                    <span className="block text-sm text-muted-foreground">{check.description}</span>
                                </span>
                            </span>
                            <span className="text-xl font-semibold">{check.value}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("colName")}</TableHead>
                            <TableHead>{t("colCategory")}</TableHead>
                            <TableHead>{t("colCountries")}</TableHead>
                            <TableHead className="text-center">{t("colLeads")}</TableHead>
                            <TableHead className="text-center">{t("colSales")}</TableHead>
                            <TableHead className="text-right">{t("colPrice")}</TableHead>
                            <TableHead className="text-center">{t("colStatus")}</TableHead>
                            <TableHead className="text-right">{t("colActions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lists.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12">
                                    <p className="text-muted-foreground mb-4">
                                        {t("emptyTitle")}
                                    </p>
                                    <Link href="/super-admin/marketplace/lists/new">
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            {t("createFirst")}
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ) : (
                            lists.map((list) => (
                                <TableRow key={list.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{list.name}</p>
                                            <p className="text-xs text-muted-foreground">{list.slug}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{list.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">
                                            {list.countries.slice(0, 3).join(", ")}
                                            {list.countries.length > 3 && ` +${list.countries.length - 3}`}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {list._count.leads.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {list._count.purchaseItems}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(Number(list.price), list.currency)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={list.isActive ? "default" : "secondary"}>
                                            {list.isActive ? t("badgeActive") : t("badgeInactive")}
                                        </Badge>
                                        {list.isFeatured && (
                                            <Badge variant="outline" className="ml-1">
                                                {t("badgeFeatured")}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Link href={`/super-admin/marketplace/lists/${list.id}/leads`}>
                                                <Button variant="ghost" size="icon" title={t("viewLeads")}>
                                                    <Users className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/super-admin/marketplace/lists/${list.id}`}>
                                                <Button variant="ghost" size="icon" title={t("edit")}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <DeleteListButton listId={list.id} listName={list.name} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
