// app/super-admin/workspaces/[id]/page.tsx.bak

import { notFound } from "next/navigation"
import Link from "next/link"
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Users,
    Send,
    Phone,
    Mail,
    FileText,
    Calendar,
    User,
    Tag,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { getWorkspaceDetails, getWorkspaceStats } from "@/actions/admin/workspaces"
import { TransferWorkspaceModal } from "@/components/admin/transfer-workspace-modal"
import { DeleteWorkspaceButton } from "@/components/admin/delete-workspace-button"
import { ExportWorkspaceButton } from "@/components/admin/export-workspace-button"
import { format } from "date-fns"
import { getAdminLocale, getAdminTranslations } from "@/lib/i18n/admin-locale"
import { dateFnsLocaleFor } from "@/lib/i18n/date-locale"

interface WorkspaceDetailsPageProps {
    params: Promise<{ id: string }>
}

export default async function WorkspaceDetailsPage({ params }: WorkspaceDetailsPageProps) {
    const { id } = await params

    const [workspace, stats] = await Promise.all([
        getWorkspaceDetails(id),
        getWorkspaceStats(id),
    ])

    if (!workspace) {
        notFound()
    }

    const t = await getAdminTranslations("admin.workspaceDetails")
    const dateLocale = dateFnsLocaleFor(await getAdminLocale())

    const ownerInitials = workspace.user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || workspace.user.email[0].toUpperCase()

    // Status distribution for chart
    const statusColors: Record<string, string> = {
        NEW: "bg-blue-500",
        CONTACTED: "bg-yellow-500",
        INTERESTED: "bg-admin",
        NOT_INTERESTED: "bg-red-500",
        CONVERTED: "bg-purple-500",
    }
    const readinessChecks = [
        {
            label: t("leadsCheck"),
            description: stats.totalLeads > 0 ? t("leadsCheckOk", { count: stats.totalLeads.toLocaleString() }) : t("leadsCheckFail"),
            done: stats.totalLeads > 0,
        },
        {
            label: t("templatesCheck"),
            description: workspace._count.emailTemplates > 0 ? t("templatesCheckOk", { count: workspace._count.emailTemplates }) : t("templatesCheckFail"),
            done: workspace._count.emailTemplates > 0,
        },
        {
            label: t("smtpCheck"),
            description: workspace.smtpProvider ? t("smtpCheckOk", { provider: workspace.smtpProvider }) : t("smtpCheckFail"),
            done: Boolean(workspace.smtpProvider),
        },
        {
            label: t("campaignsCheck"),
            description: stats.campaignsSent > 0 ? t("campaignsCheckOk", { count: stats.campaignsSent }) : t("campaignsCheckFail"),
            done: stats.campaignsSent > 0,
        },
        {
            label: t("callsCheck"),
            description: stats.totalCalls > 0 ? t("callsCheckOk", { answered: stats.callsAnswered, total: stats.totalCalls }) : t("callsCheckFail"),
            done: stats.totalCalls > 0,
        },
    ]
    const completedReadiness = readinessChecks.filter((check) => check.done).length
    const readiness = Math.round((completedReadiness / readinessChecks.length) * 100)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link
                    href="/super-admin/workspaces"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    {t("backToWorkspaces")}
                </Link>

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
                            style={{ backgroundColor: workspace.color }}
                        >
                            {workspace.name[0].toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{workspace.name}</h1>
                            {workspace.description && (
                                <p className="text-muted-foreground">{workspace.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <ExportWorkspaceButton
                            workspaceId={workspace.id}
                            workspaceName={workspace.name}
                        />
                        <TransferWorkspaceModal
                            workspaceId={workspace.id}
                            workspaceName={workspace.name}
                            currentOwner={workspace.user}
                        />
                        <DeleteWorkspaceButton
                            workspaceId={workspace.id}
                            workspaceName={workspace.name}
                        />
                    </div>
                </div>
            </div>

            <Card className={readiness >= 80 ? "border-admin dark:border-admin-soft" : "border-amber-300 dark:border-amber-900"}>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <CardTitle>{t("readiness")}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t("readinessDesc")}
                        </p>
                    </div>
                    <div className="w-full space-y-2 lg:w-64">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t("coverage")}</span>
                            <span className="font-medium">{readiness}%</span>
                        </div>
                        <Progress value={readiness} />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-5">
                    {readinessChecks.map((check) => (
                        <div key={check.label} className="flex min-h-[98px] gap-3 rounded-lg border bg-background p-4">
                            {check.done ? (
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-admin" />
                            ) : (
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                            )}
                            <div>
                                <p className="font-medium leading-tight">{check.label}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{check.description}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Info + Owner */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Dono */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {t("ownerTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href={`/super-admin/users/${workspace.user.id}`}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-violet-100 text-violet-700">
                                    {ownerInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">
                                    {workspace.user.name || t("noName")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {workspace.user.email}
                                </p>
                            </div>
                        </Link>

                        <Separator className="my-4" />

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t("createdLabel")}</span>
                                <span>
                                    {format(new Date(workspace.createdAt), "P", { locale: dateLocale })}
                                </span>
                            </div>
                            {workspace.smtpProvider && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">{t("smtpLabel")}</span>
                                    <Badge variant="outline">{workspace.smtpProvider}</Badge>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Overview */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{t("overviewTitle")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                                <Users className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                                <p className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">{t("leads")}</p>
                            </div>

                            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-center">
                                <Send className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                                <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
                                <p className="text-sm text-muted-foreground">{t("campaigns")}</p>
                            </div>

                            <div className="p-4 bg-admin-soft rounded-lg text-center">
                                <Mail className="h-6 w-6 mx-auto text-admin mb-2" />
                                <p className="text-2xl font-bold">{stats.totalEmails.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">{t("emails")}</p>
                            </div>

                            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
                                <Phone className="h-6 w-6 mx-auto text-amber-600 mb-2" />
                                <p className="text-2xl font-bold">{stats.totalCalls}</p>
                                <p className="text-sm text-muted-foreground">{t("calls")}</p>
                            </div>
                        </div>

                        {/* Taxa de abertura */}
                        {stats.totalEmails > 0 && (
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">{t("openRate")}</span>
                                    <span className="text-sm font-bold">{stats.openRate}%</span>
                                </div>
                                <Progress value={stats.openRate} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t("openRateDetail", { opened: stats.emailsOpened.toLocaleString(), total: stats.totalEmails.toLocaleString() })}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Leads por Status */}
            {stats.leadsByStatus.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            {t("leadsByStatusTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                            {stats.leadsByStatus.map((item) => (
                                <div
                                    key={item.status}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${statusColors[item.status] || "bg-gray-500"}`} />
                                        <span className="text-sm font-medium">{item.status}</span>
                                    </div>
                                    <Badge variant="secondary">{item.count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Campanhas Recentes */}
            {stats.recentCampaigns.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            {t("recentCampaignsTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.recentCampaigns.map((campaign) => (
                                <div
                                    key={campaign.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{campaign.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {campaign.sentAt
                                                ? t("campaignSent", { date: format(new Date(campaign.sentAt), "P", { locale: dateLocale }) })
                                                : t("campaignNotSent")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant={campaign.status === "SENT" ? "default" : "secondary"}
                                        >
                                            {campaign.status}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {campaign.totalSent} {t("sent")}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recursos */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {t("resourcesTitle")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-4 border rounded-lg text-center">
                            <p className="text-3xl font-bold">{workspace._count.emailTemplates}</p>
                            <p className="text-sm text-muted-foreground">{t("templatesCount")}</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                            <p className="text-3xl font-bold">{workspace._count.tags}</p>
                            <p className="text-sm text-muted-foreground">{t("tags")}</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                            <p className="text-3xl font-bold">{stats.campaignsSent}</p>
                            <p className="text-sm text-muted-foreground">{t("campaignsSent")}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
