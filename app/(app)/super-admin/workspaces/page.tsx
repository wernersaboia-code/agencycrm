// app/super-admin/workspaces/page.tsx.bak

import { Suspense } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    CheckCircle2,
    FileText,
    Filter,
    Megaphone,
    Phone,
    Search,
    Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getWorkspaces } from "@/actions/admin/workspaces"
import { formatDistanceToNow } from "date-fns"
import { getAdminLocale, getAdminTranslations } from "@/lib/i18n/admin-locale"
import { dateFnsLocaleFor } from "@/lib/i18n/date-locale"

interface WorkspacesPageProps {
    searchParams: Promise<{
        search?: string
        page?: string
    }>
}

export default async function WorkspacesPage({ searchParams }: WorkspacesPageProps) {
    const params = await searchParams
    const t = await getAdminTranslations("admin.workspaces")
    const common = await getAdminTranslations("admin.common")

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
                        {common("backToDashboard")}
                    </Link>
                </Button>
            </div>

            <Card className="border-admin-soft bg-admin-soft">
                <CardContent className="p-4 text-sm text-admin">
                    {t("infoCard")}
                </CardContent>
            </Card>

            {/* Filtros */}
            <Card>
                <CardContent className="pt-6">
                    <form className="flex gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    name="search"
                                    placeholder={t("searchPlaceholder")}
                                    defaultValue={params.search}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Button type="submit">
                            <Filter className="h-4 w-4 mr-2" />
                            {t("searchButton")}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Tabela */}
            <Suspense fallback={<WorkspacesTableSkeleton />}>
                <WorkspacesTable
                    search={params.search}
                    page={params.page ? parseInt(params.page) : 1}
                />
            </Suspense>
        </div>
    )
}

async function WorkspacesTable({
                                   search,
                                   page,
                               }: {
    search?: string
    page: number
}) {
    const { workspaces, total, pages, currentPage } = await getWorkspaces({
        search,
        page,
    })

    const t = await getAdminTranslations("admin.workspaces")
    const common = await getAdminTranslations("admin.common")
    const dateLocale = dateFnsLocaleFor(await getAdminLocale())

    if (workspaces.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">{t("emptyTitle")}</h3>
                    <p className="text-muted-foreground">
                        {search ? t("emptyDesc") : t("emptyDescNoSearch")}
                    </p>
                </CardContent>
            </Card>
        )
    }

    const withoutLeads = workspaces.filter((workspace) => workspace._count.leads === 0).length
    const withoutCampaigns = workspaces.filter((workspace) => workspace._count.campaigns === 0).length
    const withoutCalls = workspaces.filter((workspace) => workspace._count.calls === 0).length
    const withoutTemplates = workspaces.filter((workspace) => workspace._count.emailTemplates === 0).length
    const activeWorkspaces = workspaces.filter((workspace) =>
        workspace._count.leads > 0 ||
        workspace._count.campaigns > 0 ||
        workspace._count.calls > 0
    ).length
    const workspaceSignals = [
        {
            label: t("noLeads"),
            value: withoutLeads,
            description: t("noLeadsDesc"),
            icon: Users,
            tone: withoutLeads > 0 ? "warning" : "success",
        },
        {
            label: t("noTemplates"),
            value: withoutTemplates,
            description: t("noTemplatesDesc"),
            icon: FileText,
            tone: withoutTemplates > 0 ? "warning" : "success",
        },
        {
            label: t("noCampaigns"),
            value: withoutCampaigns,
            description: t("noCampaignsDesc"),
            icon: Megaphone,
            tone: withoutCampaigns > 0 ? "warning" : "success",
        },
        {
            label: t("noCalls"),
            value: withoutCalls,
            description: t("noCallsDesc"),
            icon: Phone,
            tone: withoutCalls > 0 ? "warning" : "success",
        },
    ]

    return (
        <div className="space-y-4">
        <Card className={activeWorkspaces === workspaces.length ? "border-admin dark:border-admin-soft" : "border-amber-300 dark:border-amber-900"}>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <CardTitle>{t("healthTitle")}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {t("healthDesc", { active: activeWorkspaces, total: workspaces.length })}
                    </p>
                </div>
                <Badge variant={activeWorkspaces === workspaces.length ? "default" : "outline"}>
                    {activeWorkspaces === workspaces.length ? t("operationActive") : t("stuckClients")}
                </Badge>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
                {workspaceSignals.map((signal) => (
                    <div
                        key={signal.label}
                        className="flex min-h-[96px] items-start justify-between gap-3 rounded-lg border bg-background p-4"
                    >
                        <span className="flex min-w-0 gap-3">
                            {signal.tone === "success" ? (
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-admin" />
                            ) : (
                                <signal.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                            )}
                            <span>
                                <span className="block font-medium">{signal.label}</span>
                                <span className="block text-sm text-muted-foreground">{signal.description}</span>
                            </span>
                        </span>
                        <span className="text-xl font-semibold">{signal.value}</span>
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t("workspacesCount", { count: total })}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("colWorkspace")}</TableHead>
                            <TableHead>{t("colManager")}</TableHead>
                            <TableHead className="text-center">{t("colLeads")}</TableHead>
                            <TableHead className="text-center">{t("colCampaigns")}</TableHead>
                            <TableHead className="text-center">{t("colCalls")}</TableHead>
                            <TableHead className="text-center">{t("colTemplates")}</TableHead>
                            <TableHead>{t("colCreated")}</TableHead>
                            <TableHead className="text-right">{t("colActions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {workspaces.map((workspace) => {
                            const ownerInitials = workspace.user.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || workspace.user.email[0].toUpperCase()

                            return (
                                <TableRow key={workspace.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                                style={{ backgroundColor: workspace.color }}
                                            >
                                                {workspace.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium">{workspace.name}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/super-admin/users/${workspace.user.id}`}
                                            className="flex items-center gap-2 hover:underline"
                                        >
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                                                    {ownerInitials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm">
                                                {workspace.user.name || workspace.user.email}
                                            </span>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">
                                            {workspace._count.leads.toLocaleString()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">
                                            {workspace._count.campaigns}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">
                                            {workspace._count.calls}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">
                                            {workspace._count.emailTemplates}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(workspace.createdAt), {
                                                addSuffix: true,
                                                locale: dateLocale,
                                            })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/super-admin/workspaces/${workspace.id}`}>
                                                {t("viewDetails")}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>

                {/* Paginação */}
                {pages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            {common("pageXofY", { current: currentPage, total: pages })}
                        </p>
                        <div className="flex gap-2">
                            {currentPage > 1 && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/super-admin/workspaces?page=${currentPage - 1}${search ? `&search=${search}` : ""}`}>
                                        {common("previous")}
                                    </Link>
                                </Button>
                            )}
                            {currentPage < pages && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/super-admin/workspaces?page=${currentPage + 1}${search ? `&search=${search}` : ""}`}>
                                        {common("next")}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
        </div>
    )
}

function WorkspacesTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
