import Link from "next/link"
import { subDays } from "date-fns"
import {
    Activity,
    ArrowRight,
    BarChart3,
    Building2,
    CheckCircle2,
    Mail,
    MousePointerClick,
    Package,
    ShoppingCart,
    TrendingUp,
    Users,
} from "lucide-react"
import { getAdminTranslations } from "@/lib/i18n/admin-locale"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"

export async function generateMetadata() {
    const t = await getAdminTranslations("admin.analytics")
    return {
        title: t("metaTitle"),
        description: t("metaDesc"),
    }
}

type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>

async function getAnalyticsData() {
    const now = new Date()
    const last30Days = subDays(now, 30)
    const previous30Days = subDays(now, 60)

    const [
        usersTotal,
        activeUsers,
        usersLast30,
        usersPrevious30,
        workspacesTotal,
        workspacesLast30,
        leadsTotal,
        leadsLast30,
        campaignsLast30,
        emailStatsLast30,
        emailStatsPrevious30,
        callStatsLast30,
        purchaseStatsLast30,
        purchaseStatsPrevious30,
        marketplaceLists,
        marketplaceLeadsTotal,
        topWorkspaces,
        topLists,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
        prisma.user.count({ where: { createdAt: { gte: previous30Days, lt: last30Days } } }),
        prisma.workspace.count(),
        prisma.workspace.count({ where: { createdAt: { gte: last30Days } } }),
        prisma.lead.count(),
        prisma.lead.count({ where: { createdAt: { gte: last30Days } } }),
        prisma.campaign.count({ where: { createdAt: { gte: last30Days } } }),
        prisma.emailSend.aggregate({
            where: { sentAt: { gte: last30Days } },
            _count: { id: true },
            _sum: {
                openCount: true,
                clickCount: true,
            },
        }),
        prisma.emailSend.aggregate({
            where: { sentAt: { gte: previous30Days, lt: last30Days } },
            _count: { id: true },
            _sum: {
                openCount: true,
                clickCount: true,
            },
        }),
        prisma.call.groupBy({
            by: ["result"],
            where: { calledAt: { gte: last30Days } },
            _count: { id: true },
        }),
        prisma.purchase.aggregate({
            where: {
                status: "paid",
                paidAt: { gte: last30Days },
            },
            _count: { id: true },
            _sum: { total: true },
        }),
        prisma.purchase.aggregate({
            where: {
                status: "paid",
                paidAt: { gte: previous30Days, lt: last30Days },
            },
            _count: { id: true },
            _sum: { total: true },
        }),
        prisma.leadList.count({ where: { isActive: true } }),
        prisma.marketplaceLead.count(),
        prisma.workspace.findMany({
            orderBy: { leads: { _count: "desc" } },
            take: 5,
            select: {
                id: true,
                name: true,
                plan: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        leads: true,
                        campaigns: true,
                        calls: true,
                    },
                },
            },
        }),
        prisma.leadList.findMany({
            where: { isActive: true },
            orderBy: { purchaseItems: { _count: "desc" } },
            take: 5,
            select: {
                id: true,
                name: true,
                totalLeads: true,
                price: true,
                currency: true,
                _count: {
                    select: {
                        purchaseItems: true,
                    },
                },
            },
        }),
    ])

    const emailsSent = emailStatsLast30._count.id
    const emailsOpened = emailStatsLast30._sum.openCount || 0
    const emailsClicked = emailStatsLast30._sum.clickCount || 0
    const previousEmailsSent = emailStatsPrevious30._count.id
    const revenueLast30 = Number(purchaseStatsLast30._sum.total || 0)
    const revenuePrevious30 = Number(purchaseStatsPrevious30._sum.total || 0)
    const answeredResults = ["ANSWERED", "INTERESTED", "NOT_INTERESTED", "CALLBACK", "MEETING_SCHEDULED"]
    const callsTotal = callStatsLast30.reduce((sum, item) => sum + item._count.id, 0)
    const callsAnswered = callStatsLast30
        .filter((item) => answeredResults.includes(item.result))
        .reduce((sum, item) => sum + item._count.id, 0)

    return {
        usersTotal,
        activeUsers,
        usersLast30,
        usersPrevious30,
        workspacesTotal,
        workspacesLast30,
        leadsTotal,
        leadsLast30,
        campaignsLast30,
        marketplaceLists,
        marketplaceLeadsTotal,
        emailsSent,
        emailsOpened,
        emailsClicked,
        previousEmailsSent,
        openRate: percentage(emailsOpened, emailsSent),
        clickRate: percentage(emailsClicked, emailsSent),
        callsTotal,
        callsAnswered,
        callAnswerRate: percentage(callsAnswered, callsTotal),
        purchasesLast30: purchaseStatsLast30._count.id,
        purchasesPrevious30: purchaseStatsPrevious30._count.id,
        revenueLast30,
        revenuePrevious30,
        topWorkspaces,
        topLists: topLists.map((list) => ({
            ...list,
            price: Number(list.price),
        })),
    }
}

export default async function SuperAdminAnalyticsPage() {
    const t = await getAdminTranslations("admin.analytics")
    const data = await getAnalyticsData()
    const activationRate = percentage(data.activeUsers, data.usersTotal)
    const crmMomentum = data.leadsLast30 + data.campaignsLast30 + data.callsTotal
    const marketplaceMomentum = data.purchasesLast30 + data.marketplaceLists

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-muted-foreground">
                        {t("subtitle")}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/super-admin/users">
                            {t("usersLink")}
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/super-admin/marketplace/purchases">
                            {t("salesLink")}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title={t("activeUsers")}
                    value={`${data.activeUsers}/${data.usersTotal}`}
                    description={t("activeUsersDesc", {rate: activationRate})}
                    icon={Users}
                    tone="blue"
                    trend={compare(data.usersLast30, data.usersPrevious30)}
                />
                <MetricCard
                    title={t("revenue30d")}
                    value={formatCurrency(data.revenueLast30, "EUR")}
                    description={t("revenue30dDesc", {count: data.purchasesLast30})}
                    icon={ShoppingCart}
                    tone="indigo"
                    trend={compare(data.revenueLast30, data.revenuePrevious30)}
                />
                <MetricCard
                    title={t("emailsSent")}
                    value={data.emailsSent.toLocaleString()}
                    description={t("emailsSentDesc", {openRate: data.openRate, clickRate: data.clickRate})}
                    icon={Mail}
                    tone="violet"
                    trend={compare(data.emailsSent, data.previousEmailsSent)}
                />
                <MetricCard
                    title={t("leadsInSystem")}
                    value={(data.leadsTotal + data.marketplaceLeadsTotal).toLocaleString()}
                    description={t("leadsInSystemDesc", {count: data.leadsLast30})}
                    icon={Package}
                    tone="amber"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            {t("operationalFunnel")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <ProgressRow
                            label={t("userActivation")}
                            value={activationRate}
                            detail={t("userActivationDetail", {active: data.activeUsers, total: data.usersTotal})}
                        />
                        <ProgressRow
                            label={t("emailOpenRate")}
                            value={data.openRate}
                            detail={t("emailOpenRateDetail", {opened: data.emailsOpened, sent: data.emailsSent})}
                        />
                        <ProgressRow
                            label={t("campaignClicks")}
                            value={data.clickRate}
                            detail={t("campaignClicksDetail", {clicks: data.emailsClicked})}
                        />
                        <ProgressRow
                            label={t("callsAnswered")}
                            value={data.callAnswerRate}
                            detail={t("callsAnsweredDetail", {answered: data.callsAnswered, total: data.callsTotal})}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            {t("quickSignals")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Signal
                            title="CRM"
                            value={crmMomentum}
                            description={t("crmSignal", {leads: data.leadsLast30, campaigns: data.campaignsLast30, calls: data.callsTotal})}
                            healthy={crmMomentum > 0}
                            href="/super-admin/workspaces"
                        />
                        <Signal
                            title="Catálogo"
                            value={marketplaceMomentum}
                            description={t("marketplaceSignal", {lists: data.marketplaceLists, sales: data.purchasesLast30})}
                            healthy={marketplaceMomentum > 0}
                            href="/super-admin/marketplace"
                        />
                        <Signal
                            title="Empresas/Contas"
                            value={data.workspacesTotal}
                            description={t("workspacesSignal", {count: data.workspacesLast30})}
                            healthy={data.workspacesTotal > 0}
                            href="/super-admin/workspaces"
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <TopWorkspaces data={data} t={t} />
                <TopLists data={data} t={t} />
            </div>
        </div>
    )
}

function percentage(value: number, total: number) {
    return total > 0 ? Math.round((value / total) * 100) : 0
}

function compare(current: number, previous: number) {
    if (previous === 0) {
        return current > 0 ? "+100%" : "0%"
    }

    const delta = Math.round(((current - previous) / previous) * 100)
    return `${delta > 0 ? "+" : ""}${delta}%`
}

function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    tone,
    trend,
}: {
    title: string
    value: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    tone: "blue" | "indigo" | "violet" | "amber"
    trend?: string
}) {
    const tones = {
        blue: "bg-blue-50 text-blue-600",
        indigo: "bg-admin-soft text-admin",
        violet: "bg-violet-50 text-violet-600",
        amber: "bg-amber-50 text-amber-600",
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>
                    {trend && (
                        <Badge variant="outline" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {trend}
                        </Badge>
                    )}
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-md ${tones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

function ProgressRow({ label, value, detail }: { label: string; value: number; detail: string }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">{value}%</span>
            </div>
            <Progress value={value} />
            <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
    )
}

function Signal({
    title,
    value,
    description,
    healthy,
    href,
}: {
    title: string
    value: number
    description: string
    healthy: boolean
    href: string
}) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
        >
            <div className="flex min-w-0 items-start gap-3">
                {healthy ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-admin" />
                ) : (
                    <Activity className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                )}
                <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
            <div className="text-xl font-semibold">{value.toLocaleString()}</div>
        </Link>
    )
}

function TopWorkspaces({ data, t }: { data: AnalyticsData; t: Awaited<ReturnType<typeof getAdminTranslations>> }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {t("workspacesByVolume")}
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/super-admin/workspaces">
                        {t("viewAll")}
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-3">
                {data.topWorkspaces.length === 0 ? (
                    <EmptyText text={t("noWorkspaces")} />
                ) : (
                    data.topWorkspaces.map((workspace) => (
                        <Link
                            key={workspace.id}
                            href={`/super-admin/workspaces/${workspace.id}`}
                            className="flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium">{workspace.name}</p>
                                <p className="truncate text-sm text-muted-foreground">
                                    {workspace.user.name || workspace.user.email} - {workspace.plan}
                                </p>
                            </div>
                            <div className="text-right text-sm">
                                <p className="font-semibold">{workspace._count.leads.toLocaleString()} leads</p>
                                <p className="text-muted-foreground">
                                    {workspace._count.campaigns} campanhas, {workspace._count.calls} ligações
                                </p>
                            </div>
                        </Link>
                    ))
                )}
            </CardContent>
        </Card>
    )
}

function TopLists({ data, t }: { data: AnalyticsData; t: Awaited<ReturnType<typeof getAdminTranslations>> }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <MousePointerClick className="h-5 w-5" />
                    {t("topLists")}
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/super-admin/marketplace/lists">
                        {t("viewLists")}
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-3">
                {data.topLists.length === 0 ? (
                    <EmptyText text={t("noLists")} />
                ) : (
                    data.topLists.map((list) => (
                        <Link
                            key={list.id}
                            href={`/super-admin/marketplace/lists/${list.id}`}
                            className="flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium">{list.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {list.totalLeads.toLocaleString()} leads - {formatCurrency(list.price, list.currency)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-semibold">{list._count.purchaseItems}</p>
                                <p className="text-xs text-muted-foreground">{t("purchases")}</p>
                            </div>
                        </Link>
                    ))
                )}
            </CardContent>
        </Card>
    )
}

function EmptyText({ text }: { text: string }) {
    return (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {text}
        </div>
    )
}
