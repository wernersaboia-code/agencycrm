import Link from "next/link"
import type { ComponentType } from "react"
import { getTranslations } from "next-intl/server"
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
    const t = await getTranslations("admin.dashboard")
    const common = await getTranslations("admin.common")

    const mainActions = [
        {
            title: t("manageLists"),
            description: t("manageListsDesc"),
            href: "/super-admin/marketplace/lists",
            icon: Package,
            tone: "primary",
        },
        {
            title: t("viewSales"),
            description: t("viewSalesDesc"),
            href: "/super-admin/marketplace/purchases",
            icon: ShoppingCart,
            tone: "default",
        },
        {
            title: t("manageUsers"),
            description: t("manageUsersDesc"),
            href: "/super-admin/users",
            icon: Users,
            tone: "default",
        },
        {
            title: t("companies"),
            description: t("companiesDesc"),
            href: "/super-admin/workspaces",
            icon: Building2,
            tone: "default",
        },
        {
            title: t("openCrm"),
            description: t("openCrmDesc"),
            href: "/dashboard",
            icon: Rocket,
            tone: "default",
        },
    ] as const

    const metrics = [
        {
            label: t("activeLists"),
            value: stats.totalLists.toLocaleString("pt-BR"),
            detail: t("listsWithLeads", { count: stats.totalLeadsMarketplace }),
            icon: Store,
        },
        {
            label: t("paidSales"),
            value: stats.totalPurchases.toLocaleString("pt-BR"),
            detail: t("thisMonth", { count: stats.purchasesThisMonth }),
            icon: ShoppingCart,
        },
        {
            label: t("totalRevenue"),
            value: formatCurrency(stats.totalRevenue, "EUR"),
            detail: t("revenueThisMonth", { value: formatCurrency(stats.revenueThisMonth, "EUR") }),
            icon: BarChart3,
        },
        {
            label: t("activeUsers"),
            value: `${stats.activeUsers}/${stats.totalUsers}`,
            detail: t("usersThisMonth", { count: stats.usersThisMonth }),
            icon: Users,
        },
    ]

    return (
        <div className="space-y-6">
            <section className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Badge variant="outline" className="mb-3 border-admin-soft bg-admin-soft text-admin">
                            {t("badge")}
                        </Badge>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {t("title")}
                        </h1>
                        <p className="mt-2 max-w-2xl text-muted-foreground">
                            {t("subtitle")}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/">
                            {common("backToHome")}
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
                        <CardTitle>{t("quickSummary")}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                        <SummaryLink
                            title={t("marketplaceCatalog")}
                            description={t("catalogDesc", { count: stats.totalLists })}
                            href="/super-admin/marketplace"
                            icon={Store}
                        />
                        <SummaryLink
                            title={t("reports")}
                            description={t("reportsDesc")}
                            href="/super-admin/analytics"
                            icon={BarChart3}
                        />
                        <SummaryLink
                            title={t("supportShort")}
                            description={t("supportDesc")}
                            href="/super-admin/support"
                            icon={LifeBuoy}
                        />
                        <SummaryLink
                            title={t("settingsShort")}
                            description={t("settingsDesc")}
                            href="/super-admin/settings"
                            icon={Settings}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("shortcuts")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button className="w-full justify-between bg-admin hover:bg-admin" asChild>
                            <Link href="/super-admin/marketplace/lists/new">
                                {t("createNewList")}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-between" asChild>
                            <Link href="/super-admin/marketplace/purchases">
                                {t("checkSales")}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-between" asChild>
                            <Link href="/super-admin/users">
                                {t("viewUsers")}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}

async function AdminActionCard({
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
    const t = await getTranslations("admin.dashboard")
    const isPrimary = tone === "primary"

    return (
        <Link
            href={href}
            className={`group flex min-h-52 flex-col justify-between rounded-lg border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                isPrimary
                    ? "border-admin bg-admin text-white"
                    : "border-gray-200 bg-white text-gray-950 hover:border-admin"
            }`}
        >
            <div>
                <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-md ${
                        isPrimary ? "bg-white/15 text-white" : "bg-admin-soft text-admin"
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
                {t("open")}
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
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-admin-soft text-admin">
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
