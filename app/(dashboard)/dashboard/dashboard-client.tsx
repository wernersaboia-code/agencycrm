// app/(dashboard)/dashboard/dashboard-client.tsx

"use client"

import Link from "next/link"
import { format, isPast, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    CheckSquare,
    AlertTriangle,
    Users,
    Building2,
    ArrowRight,
    Calendar,
    Briefcase,
} from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    Cell,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type {
    DashboardStats,
    DealsByStage,
    DealsOverTime,
    UpcomingTask,
    RecentDeal,
} from "@/actions/dashboard"

type DashboardClientProps = {
    stats: DashboardStats
    dealsByStage: DealsByStage[]
    dealsOverTime: DealsOverTime[]
    upcomingTasks: UpcomingTask[]
    recentDeals: RecentDeal[]
}

// Formatar moeda
function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

// Formatar número compacto
function formatCompact(value: number): string {
    if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(0)}K`
    }
    return formatCurrency(value)
}

// Config de prioridade
const priorityConfig = {
    LOW: { label: "Baixa", color: "bg-gray-100 text-gray-700" },
    MEDIUM: { label: "Média", color: "bg-blue-100 text-blue-700" },
    HIGH: { label: "Alta", color: "bg-orange-100 text-orange-700" },
    URGENT: { label: "Urgente", color: "bg-red-100 text-red-700" },
}

// Config de status do deal
const dealStatusConfig = {
    OPEN: { label: "Aberto", color: "bg-blue-100 text-blue-700" },
    WON: { label: "Ganho", color: "bg-green-100 text-green-700" },
    LOST: { label: "Perdido", color: "bg-red-100 text-red-700" },
    ABANDONED: { label: "Abandonado", color: "bg-gray-100 text-gray-700" },
}

// Componente customizado para Tooltip do gráfico de barras
function CustomBarTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="bg-card border rounded-lg p-3 shadow-lg">
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">
                    Deals: <span className="font-medium text-foreground">{data.count}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                    Valor: <span className="font-medium text-foreground">{formatCurrency(data.value)}</span>
                </p>
            </div>
        )
    }
    return null
}

// Componente customizado para Tooltip do gráfico de linha
function CustomLineTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border rounded-lg p-3 shadow-lg">
                <p className="font-medium mb-2">{label}</p>
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

export function DashboardClient({
                                    stats,
                                    dealsByStage,
                                    dealsOverTime,
                                    upcomingTasks,
                                    recentDeals,
                                }: DashboardClientProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Visão geral do seu CRM
                </p>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Pipeline Total */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pipeline Total
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCompact(stats.pipelineTotal)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.pipelineCount} deal{stats.pipelineCount !== 1 ? "s" : ""} em aberto
                        </p>
                    </CardContent>
                </Card>

                {/* Ganhos no Mês */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Ganhos (Mês)
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCompact(stats.wonThisMonth)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.wonThisMonthCount} deal{stats.wonThisMonthCount !== 1 ? "s" : ""} fechado{stats.wonThisMonthCount !== 1 ? "s" : ""}
                        </p>
                    </CardContent>
                </Card>

                {/* Perdidos no Mês */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Perdidos (Mês)
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCompact(stats.lostThisMonth)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.lostThisMonthCount} deal{stats.lostThisMonthCount !== 1 ? "s" : ""} perdido{stats.lostThisMonthCount !== 1 ? "s" : ""}
                        </p>
                    </CardContent>
                </Card>

                {/* Tarefas */}
                <Card className={cn(stats.overdueTasks > 0 && "border-red-300 dark:border-red-800")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tarefas Pendentes
                        </CardTitle>
                        {stats.overdueTasks > 0 ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                            <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingTasks}</div>
                        {stats.overdueTasks > 0 ? (
                            <p className="text-xs text-red-500 mt-1">
                                {stats.overdueTasks} atrasada{stats.overdueTasks !== 1 ? "s" : ""}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground mt-1">
                                Nenhuma atrasada
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Segunda linha de cards menores */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Contatos
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalContacts}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Empresas
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Taxa de Conversão
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.wonThisMonthCount + stats.lostThisMonthCount > 0
                                ? Math.round(
                                    (stats.wonThisMonthCount /
                                        (stats.wonThisMonthCount + stats.lostThisMonthCount)) *
                                    100
                                )
                                : 0}
                            %
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Este mês</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Ticket Médio
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.wonThisMonthCount > 0
                                ? formatCompact(stats.wonThisMonth / stats.wonThisMonthCount)
                                : "R$ 0"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Deals ganhos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Funil de Vendas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Funil de Vendas</CardTitle>
                        <CardDescription>Deals por estágio do pipeline</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dealsByStage.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dealsByStage} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" />
                                    <YAxis
                                        type="category"
                                        dataKey="stage"
                                        width={100}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip content={<CustomBarTooltip />} />
                                    <Bar dataKey="count" name="count" radius={[0, 4, 4, 0]}>
                                        {dealsByStage.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                Nenhum deal no pipeline
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Deals ao Longo do Tempo */}
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Mensal</CardTitle>
                        <CardDescription>Deals ganhos vs perdidos nos últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dealsOverTime.some((d) => d.won > 0 || d.lost > 0) ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={dealsOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip content={<CustomLineTooltip />} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="won"
                                        name="Ganhos"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        dot={{ fill: "#22c55e" }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="lost"
                                        name="Perdidos"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ fill: "#ef4444" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                Sem dados no período
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Listas */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Próximas Tarefas */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Próximas Tarefas</CardTitle>
                            <CardDescription>Suas tarefas pendentes</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/tasks">
                                Ver todas
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {upcomingTasks.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingTasks.map((task) => {
                                    const isOverdue =
                                        task.dueDate &&
                                        isPast(new Date(task.dueDate)) &&
                                        !isToday(new Date(task.dueDate))

                                    return (
                                        <Link
                                            key={task.id}
                                            href={`/tasks/${task.id}`}
                                            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{task.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "text-xs",
                                                            priorityConfig[task.priority as keyof typeof priorityConfig]?.color
                                                        )}
                                                    >
                                                        {priorityConfig[task.priority as keyof typeof priorityConfig]?.label}
                                                    </Badge>
                                                    {task.dueDate && (
                                                        <span
                                                            className={cn(
                                                                "text-xs flex items-center gap-1",
                                                                isOverdue ? "text-red-500" : "text-muted-foreground"
                                                            )}
                                                        >
                                                            <Calendar className="h-3 w-3" />
                                                            {isToday(new Date(task.dueDate))
                                                                ? "Hoje"
                                                                : format(new Date(task.dueDate), "dd/MM", {
                                                                    locale: ptBR,
                                                                })}
                                                        </span>
                                                    )}
                                                </div>
                                                {(task.contact || task.company) && (
                                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                                        {task.contact
                                                            ? `${task.contact.firstName} ${task.contact.lastName}`
                                                            : task.company?.name}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <CheckSquare className="h-8 w-8 mb-2" />
                                <p>Nenhuma tarefa pendente</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Deals Recentes */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Deals Recentes</CardTitle>
                            <CardDescription>Últimos deals criados</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/deals">
                                Ver todos
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentDeals.length > 0 ? (
                            <div className="space-y-3">
                                {recentDeals.map((deal) => (
                                    <Link
                                        key={deal.id}
                                        href={`/deals/${deal.id}`}
                                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium truncate">{deal.title}</p>
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "text-xs",
                                                        dealStatusConfig[deal.status as keyof typeof dealStatusConfig]?.color
                                                    )}
                                                >
                                                    {dealStatusConfig[deal.status as keyof typeof dealStatusConfig]?.label}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                {deal.value && (
                                                    <span className="text-sm font-medium text-green-600">
                                                        {formatCurrency(deal.value)}
                                                    </span>
                                                )}
                                                {deal.stage && (
                                                    <Badge
                                                        variant="outline"
                                                        style={{
                                                            borderColor: deal.stage.color,
                                                            color: deal.stage.color,
                                                        }}
                                                    >
                                                        {deal.stage.name}
                                                    </Badge>
                                                )}
                                            </div>
                                            {(deal.contact || deal.company) && (
                                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                                    {deal.company?.name}
                                                    {deal.company && deal.contact && " • "}
                                                    {deal.contact &&
                                                        `${deal.contact.firstName} ${deal.contact.lastName}`}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <Briefcase className="h-8 w-8 mb-2" />
                                <p>Nenhum deal criado</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}