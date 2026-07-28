// app/super-admin/users/[id]/page.tsx.bak

import { notFound } from "next/navigation"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Mail,
    Calendar,
    Clock,
    Building2,
    Users,
    Phone,
    BarChart3,
    Send,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { getUserDetails, getUserStats } from "@/actions/admin/users"
import { UserRoleSelect } from "@/components/admin/user-role-select"
import { UserStatusToggle } from "@/components/admin/user-status-toggle"
import { ResetPasswordButton } from "@/components/admin/reset-password-button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface UserDetailsPageProps {
    params: Promise<{ id: string }>
}

export default async function UserDetailsPage({ params }: UserDetailsPageProps) {
    const { id } = await params
    const t = await getTranslations("admin.userDetails")

    const [user, stats] = await Promise.all([
        getUserDetails(id),
        getUserStats(id),
    ])

    if (!user) {
        notFound()
    }

    const initials = user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || user.email[0].toUpperCase()
    const readinessChecks = [
        {
            label: t("activeAccess"),
            description: user.status === "ACTIVE" ? t("activeAccessOk") : t("activeAccessFail"),
            done: user.status === "ACTIVE",
        },
        {
            label: t("workspaceCreated"),
            description: user._count.workspaces > 0 ? t("workspaceCreatedOk", { count: user._count.workspaces }) : t("workspaceCreatedFail"),
            done: user._count.workspaces > 0,
        },
        {
            label: t("usageRecorded"),
            description: stats.totalLeads + stats.totalCampaigns + stats.totalCalls > 0
                ? t("usageRecordedOk")
                : t("usageRecordedFail"),
            done: stats.totalLeads + stats.totalCampaigns + stats.totalCalls > 0,
        },
        {
            label: t("loginKnown"),
            description: user.lastLoginAt ? t("loginKnownOk") : t("loginKnownFail"),
            done: Boolean(user.lastLoginAt),
        },
    ]
    const completedReadiness = readinessChecks.filter((check) => check.done).length
    const readiness = Math.round((completedReadiness / readinessChecks.length) * 100)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link
                    href="/super-admin/users"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    {t("backToUsers")}
                </Link>

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-violet-100 text-violet-700 text-xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-3xl font-bold">
                                {user.name || t("noName")}
                            </h1>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    <ResetPasswordButton email={user.email} />
                </div>
            </div>

            <Card className={readiness >= 75 ? "border-admin dark:border-admin-soft" : "border-amber-300 dark:border-amber-900"}>
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
                <CardContent className="grid gap-3 md:grid-cols-4">
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

            {/* Info + Stats */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Info do Usuário */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>{t("infoTitle")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t("roleLabel")}
                            </label>
                            <UserRoleSelect
                                userId={user.id}
                                currentRole={user.role}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t("statusLabel")}
                            </label>
                            <UserStatusToggle
                                userId={user.id}
                                currentStatus={user.status}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t("createdLabel")}</span>
                                <span>
                                    {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t("lastAccessLabel")}</span>
                                <span>
                                    {user.lastLoginAt
                                        ? format(new Date(user.lastLoginAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                                        : t("never")}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t("languageLabel")}</span>
                                <span>{user.language}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{t("statsTitle")}</CardTitle>
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
                                <p className="text-sm text-muted-foreground">{t("emailsSent")}</p>
                            </div>

                            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
                                <Phone className="h-6 w-6 mx-auto text-amber-600 mb-2" />
                                <p className="text-2xl font-bold">{stats.totalCalls}</p>
                                <p className="text-sm text-muted-foreground">{t("calls")}</p>
                            </div>
                        </div>

                        {stats.lastActivity && (
                            <p className="text-sm text-muted-foreground mt-4 text-center">
                                {t("lastActivity", { date: format(new Date(stats.lastActivity), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) })}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Empresas/Contas */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {t("workspacesTitle", { count: user._count.workspaces })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {user.workspaces.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            {t("noWorkspaces")}
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {user.workspaces.map((workspace) => (
                                <Link
                                    key={workspace.id}
                                    href={`/super-admin/workspaces/${workspace.id}`}
                                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: workspace.color }}
                                        />
                                        <h3 className="font-medium">{workspace.name}</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                        <div>
                                            <p className="font-semibold">{workspace._count.leads}</p>
                                            <p className="text-xs text-muted-foreground">{t("leads")}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold">{workspace._count.campaigns}</p>
                                            <p className="text-xs text-muted-foreground">{t("campaigns")}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold">{workspace._count.calls}</p>
                                            <p className="text-xs text-muted-foreground">{t("calls")}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-sm font-medium text-primary">
                                        {t("viewWorkspace")}
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Compras no Marketplace */}
            {user._count.purchases > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            {t("purchasesTitle", { count: user._count.purchases })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            {t("purchasesDesc", { count: user._count.purchases })}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
