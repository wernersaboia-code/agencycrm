// app/(dashboard)/dashboard/dashboard-client.tsx
"use client"

import Link from "next/link"
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
import { cn } from "@/lib/utils"
import { LEAD_STATUS_CONFIG } from "@/lib/constants/lead.constants"
import { LeadStatus } from "@prisma/client"

import type {
    DashboardStats,
    CampaignSummary,
    RecentLead,
    EmailsOverTime,
    CallbacksSummary,
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

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border rounded-lg p-3 shadow-lg">
                <p className="font-medium mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-medium">{entry.value}</span>
                    </p>
                ))}
            </div>
        )
    }
    return null
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