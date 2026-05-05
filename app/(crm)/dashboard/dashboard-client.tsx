// app/(crm)/dashboard/dashboard-client.tsx
"use client"

import Link from "next/link"
import type { ElementType } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    Users,
    Mail,
    Phone,
    MousePointerClick,
    Eye,
    TrendingUp,
    ArrowRight,
    AlertTriangle,
    Calendar,
    Clock,
    Send,
    Settings,
    FileText,
    Upload,
    CheckCircle2,
} from "lucide-react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { LEAD_STATUS_CONFIG } from "@/lib/constants/lead.constants"
import { LeadStatus } from "@prisma/client"

import type {
    DashboardStats,
    CampaignSummary,
    RecentLead,
    EmailsOverTime,
    CallbacksSummary,
    DashboardGuidance,
} from "@/actions/dashboard"

// ============================================================
// TIPOS
// ============================================================

interface DashboardClientProps {
    stats: DashboardStats | null
    campaigns: CampaignSummary[]
    leads: RecentLead[]
    emailsOverTime: EmailsOverTime[]
    callbacks: CallbacksSummary | null
    guidance: DashboardGuidance | null
}

// ============================================================
// HELPERS
// ============================================================

function getLeadStatusConfig(status: string) {
    return LEAD_STATUS_CONFIG[status as LeadStatus] || LEAD_STATUS_CONFIG.NEW
}

const campaignStatusConfig: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-700" },
    SCHEDULED: { label: "Agendada", color: "bg-blue-100 text-blue-700" },
    SENDING: { label: "Enviando", color: "bg-yellow-100 text-yellow-700" },
    SENT: { label: "Enviada", color: "bg-green-100 text-green-700" },
    PAUSED: { label: "Pausada", color: "bg-orange-100 text-orange-700" },
    CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-700" },
}

interface ChartTooltipPayload {
    color?: string
    name?: string
    value?: string | number
}

interface ChartTooltipProps {
    active?: boolean
    payload?: ChartTooltipPayload[]
    label?: string
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border rounded-lg p-3 shadow-lg">
                <p className="font-medium mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-medium">{entry.value}</span>
                    </p>
                ))}
            </div>
        )
    }
    return null
}

interface ActionCard {
    title: string
    description: string
    href: string
    label: string
    icon: ElementType
    tone: "default" | "warning" | "success"
}

function buildActionCards(
    stats: DashboardStats,
    guidance: DashboardGuidance | null,
    callbacks: CallbacksSummary | null
): ActionCard[] {
    const overdueCallbacks = guidance?.overdueCallbacksCount ?? callbacks?.overdueCount ?? 0
    const todayCallbacks = callbacks?.todayCount ?? 0
    const newLeadsWithoutContact = guidance?.newLeadsWithoutContactCount ?? 0

    const actions: ActionCard[] = []

    if (overdueCallbacks > 0) {
        actions.push({
            title: `${overdueCallbacks} callback${overdueCallbacks !== 1 ? "s" : ""} atrasado${overdueCallbacks !== 1 ? "s" : ""}`,
            description: "Priorize retornos pendentes para não perder oportunidades em andamento.",
            href: "/calls",
            label: "Ver callbacks",
            icon: AlertTriangle,
            tone: "warning",
        })
    } else if (todayCallbacks > 0) {
        actions.push({
            title: `${todayCallbacks} retorno${todayCallbacks !== 1 ? "s" : ""} para hoje`,
            description: "Revise sua agenda de ligações antes de avançar em novas prospecções.",
            href: "/calls",
            label: "Abrir ligações",
            icon: Calendar,
            tone: "default",
        })
    }

    if (stats.totalLeads === 0) {
        actions.push({
            title: "Adicione seus primeiros leads",
            description: "Importe uma lista ou cadastre leads manualmente para iniciar o fluxo comercial.",
            href: "/leads/import",
            label: "Importar leads",
            icon: Upload,
            tone: "default",
        })
    } else if (newLeadsWithoutContact > 0) {
        actions.push({
            title: `${newLeadsWithoutContact} lead${newLeadsWithoutContact !== 1 ? "s" : ""} novo${newLeadsWithoutContact !== 1 ? "s" : ""} sem contato`,
            description: "Transforme leads novos em conversas antes que esfriem.",
            href: "/leads",
            label: "Ver leads",
            icon: Users,
            tone: "default",
        })
    }

    if (guidance && guidance.templatesCount === 0) {
        actions.push({
            title: "Crie um template de email",
            description: "Templates deixam campanhas mais rápidas e consistentes para cada cliente.",
            href: "/templates",
            label: "Criar template",
            icon: FileText,
            tone: "default",
        })
    } else if (guidance && guidance.activeTemplatesCount === 0) {
        actions.push({
            title: "Ative um template",
            description: "Você tem templates cadastrados, mas nenhum ativo para novas campanhas.",
            href: "/templates",
            label: "Revisar templates",
            icon: FileText,
            tone: "warning",
        })
    }

    if (guidance && (!guidance.hasSmtpConfigured || !guidance.hasSenderConfigured)) {
        actions.push({
            title: "Configure o envio de emails",
            description: "Complete remetente e SMTP para enviar campanhas com segurança.",
            href: "/settings?tab=email",
            label: "Configurar envio",
            icon: Settings,
            tone: "warning",
        })
    }

    if (stats.totalLeads > 0 && guidance && guidance.activeTemplatesCount > 0 && guidance.activeCampaignsCount === 0) {
        actions.push({
            title: guidance.draftCampaignsCount > 0 ? "Revise campanhas em rascunho" : "Crie uma campanha ativa",
            description: guidance.draftCampaignsCount > 0
                ? "Há campanhas preparadas que ainda não estão gerando envios."
                : "Combine leads e templates para iniciar uma cadência de contato.",
            href: "/campaigns",
            label: guidance.draftCampaignsCount > 0 ? "Ver rascunhos" : "Criar campanha",
            icon: Send,
            tone: "default",
        })
    }

    if (actions.length === 0) {
        actions.push({
            title: "Operação em dia",
            description: "Sem pendências críticas agora. Acompanhe métricas e mantenha o ritmo de prospecção.",
            href: "/leads",
            label: "Ver pipeline",
            icon: CheckCircle2,
            tone: "success",
        })
    }

    return actions.slice(0, 4)
}

function ActionPlan({
                        stats,
                        guidance,
                        callbacks,
                    }: {
    stats: DashboardStats
    guidance: DashboardGuidance | null
    callbacks: CallbacksSummary | null
}) {
    const actions = buildActionCards(stats, guidance, callbacks)

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Próximas ações</CardTitle>
                    <CardDescription>O que merece atenção agora neste cliente</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/leads">
                        Pipeline
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {actions.map((action) => (
                    <Link
                        key={`${action.href}-${action.title}`}
                        href={action.href}
                        className={cn(
                            "group flex min-h-[150px] flex-col justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50",
                            action.tone === "warning" && "border-amber-300 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20",
                            action.tone === "success" && "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                        )}
                    >
                        <div>
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-background shadow-sm">
                                <action.icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold leading-tight">{action.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                        </div>
                        <span className="mt-4 flex items-center text-sm font-medium">
                            {action.label}
                            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}

function SetupChecklist({
                            stats,
                            guidance,
                        }: {
    stats: DashboardStats
    guidance: DashboardGuidance | null
}) {
    if (!guidance) return null

    const steps = [
        {
            label: "Adicionar leads",
            done: stats.totalLeads > 0,
            href: "/leads/import",
            action: "Importar",
        },
        {
            label: "Criar template",
            done: guidance.activeTemplatesCount > 0,
            href: "/templates",
            action: "Criar",
        },
        {
            label: "Configurar envio",
            done: guidance.hasSmtpConfigured && guidance.hasSenderConfigured,
            href: "/settings?tab=email",
            action: "Configurar",
        },
        {
            label: "Ativar campanha",
            done: guidance.activeCampaignsCount > 0 || stats.totalEmailsSent > 0,
            href: "/campaigns",
            action: "Campanhas",
        },
    ]

    const completed = steps.filter((step) => step.done).length
    const progress = Math.round((completed / steps.length) * 100)

    if (completed === steps.length && stats.totalEmailsSent > 0) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle>Primeiros passos</CardTitle>
                        <CardDescription>Prepare este cliente para gerar e acompanhar contatos</CardDescription>
                    </div>
                    <Badge variant="secondary">{completed}/{steps.length}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Progress value={progress} />
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {steps.map((step) => (
                        <Link
                            key={step.label}
                            href={step.href}
                            className={cn(
                                "flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50",
                                step.done && "bg-muted/30"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "flex h-7 w-7 items-center justify-center rounded-full border",
                                        step.done
                                            ? "border-emerald-500 bg-emerald-500 text-white"
                                            : "bg-background text-muted-foreground"
                                    )}
                                >
                                    {step.done ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{step.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {step.done ? "Concluído" : step.action}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================================
// COMPONENTE
// ============================================================

export function DashboardClient({
                                    stats,
                                    campaigns,
                                    leads,
                                    emailsOverTime,
                                    callbacks,
                                    guidance,
                                }: DashboardClientProps) {
    // Se não tiver stats, mostrar estado vazio
    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Erro ao carregar dados do dashboard</p>
            </div>
        )
    }

    // Formatar dados do gráfico
    const chartData = emailsOverTime.map((d) => ({
        ...d,
        date: format(new Date(d.date), "dd/MM", { locale: ptBR }),
    }))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Visão geral das suas campanhas e leads
                </p>
            </div>

            <ActionPlan stats={stats} guidance={guidance} callbacks={callbacks} />
            <SetupChecklist stats={stats} guidance={guidance} />

            {/* Stats Cards - Primeira Linha */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Leads */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total de Leads
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalLeads}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            +{stats.newLeadsToday} hoje • +{stats.newLeadsWeek} na semana
                        </p>
                    </CardContent>
                </Card>

                {/* Campanhas */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Campanhas
                        </CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.activeCampaigns} ativa{stats.activeCampaigns !== 1 ? "s" : ""}
                        </p>
                    </CardContent>
                </Card>

                {/* Emails */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Emails Enviados
                        </CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalEmailsSent}</div>
                        <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Eye className="h-3 w-3" />
                  {stats.openRate}% abertos
              </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MousePointerClick className="h-3 w-3" />
                                {stats.clickRate}% cliques
              </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Ligações */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Ligações
                        </CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCalls}</div>
                        <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground">
                {stats.answerRate}% atendidas
              </span>
                            <span className="text-xs text-green-600">
                {stats.positiveRate}% positivas
              </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico e Callbacks */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Gráfico de Emails */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Emails (Últimos 7 dias)
                        </CardTitle>
                        <CardDescription>Enviados, abertos e clicados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {chartData.some((d) => d.sent > 0) ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="sent"
                                        name="Enviados"
                                        stroke="#3b82f6"
                                        fill="#3b82f6"
                                        fillOpacity={0.2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="opened"
                                        name="Abertos"
                                        stroke="#22c55e"
                                        fill="#22c55e"
                                        fillOpacity={0.2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="clicked"
                                        name="Clicados"
                                        stroke="#f59e0b"
                                        fill="#f59e0b"
                                        fillOpacity={0.2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                                Nenhum email enviado no período
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Callbacks Pendentes */}
                <Card className={cn(callbacks?.overdueCount && "border-red-300 dark:border-red-800")}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Callbacks Pendentes
                        </CardTitle>
                        <CardDescription>Ligações de retorno agendadas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {callbacks && (callbacks.overdueCount > 0 || callbacks.todayCount > 0 || callbacks.thisWeekCount > 0) ? (
                            <div className="space-y-4">
                                {/* Atrasados */}
                                {callbacks.overdueCount > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                            <span className="text-sm font-medium text-red-600">
                        {callbacks.overdueCount} atrasado{callbacks.overdueCount !== 1 ? "s" : ""}
                      </span>
                                        </div>
                                        <div className="space-y-2">
                                            {callbacks.overdue.slice(0, 3).map((cb) => (
                                                <Link
                                                    key={cb.id}
                                                    href="/calls"
                                                    className="block p-2 rounded border border-red-200 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 transition-colors"
                                                >
                                                    <p className="text-sm font-medium">{cb.leadName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {cb.leadCompany} • {formatDistanceToNow(new Date(cb.followUpAt), { locale: ptBR, addSuffix: true })}
                                                    </p>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Hoje */}
                                {callbacks.todayCount > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-medium">
                        {callbacks.todayCount} para hoje
                      </span>
                                        </div>
                                        <div className="space-y-2">
                                            {callbacks.today.slice(0, 3).map((cb) => (
                                                <Link
                                                    key={cb.id}
                                                    href="/calls"
                                                    className="block p-2 rounded border hover:bg-muted/50 transition-colors"
                                                >
                                                    <p className="text-sm font-medium">{cb.leadName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {cb.leadCompany} • {format(new Date(cb.followUpAt), "HH:mm")}
                                                    </p>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Esta semana */}
                                {callbacks.thisWeekCount > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium text-muted-foreground">
                        {callbacks.thisWeekCount} esta semana
                      </span>
                                        </div>
                                    </div>
                                )}

                                <Button variant="outline" size="sm" className="w-full" asChild>
                                    <Link href="/calls">
                                        Ver todas as ligações
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                                <Phone className="h-8 w-8 mb-2" />
                                <p>Nenhum callback pendente</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Listas */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Campanhas Recentes */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Campanhas Recentes</CardTitle>
                            <CardDescription>Últimas campanhas criadas</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/campaigns">
                                Ver todas
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {campaigns.length > 0 ? (
                            <div className="space-y-3">
                                {campaigns.map((campaign) => (
                                    <Link
                                        key={campaign.id}
                                        href={`/campaigns/${campaign.id}`}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium truncate">{campaign.name}</p>
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "text-xs shrink-0",
                                                        campaignStatusConfig[campaign.status]?.color
                                                    )}
                                                >
                                                    {campaignStatusConfig[campaign.status]?.label}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                <span>{campaign.sentCount} enviados</span>
                                                <span>{campaign.openRate}% abertos</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <Mail className="h-8 w-8 mb-2" />
                                <p>Nenhuma campanha criada</p>
                                <Button variant="outline" size="sm" className="mt-4" asChild>
                                    <Link href="/campaigns">Criar campanha</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Leads Recentes */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Leads Recentes</CardTitle>
                            <CardDescription>Últimos leads adicionados</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/leads">
                                Ver todos
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {leads.length > 0 ? (
                            <div className="space-y-3">
                                {leads.map((lead) => {
                                    const statusConfig = getLeadStatusConfig(lead.status)
                                    return (
                                        <Link
                                            key={lead.id}
                                            href={`/leads/${lead.id}`}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium truncate">
                                                        {lead.firstName} {lead.lastName}
                                                    </p>
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn("text-xs shrink-0", statusConfig.color)}
                                                    >
                                                        {statusConfig.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                                    {lead.company || lead.email}
                                                </p>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <Users className="h-8 w-8 mb-2" />
                                <p>Nenhum lead cadastrado</p>
                                <Button variant="outline" size="sm" className="mt-4" asChild>
                                    <Link href="/leads">Adicionar lead</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
