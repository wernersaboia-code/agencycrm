// app/(dashboard)/deals/[id]/page.tsx

import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Briefcase,
    Building2,
    User,
    Calendar,
    TrendingUp,
    DollarSign,
    Clock,
    CheckSquare,
    Circle,
    CheckCircle2,
    AlertCircle,
    Plus,
} from "lucide-react"
import { format, isPast, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"

import { getDealById } from "@/actions/deals"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { DealActions } from "./deal-actions"

export const metadata: Metadata = {
    title: "Detalhes do Deal | NextCRM",
}

type Props = {
    params: Promise<{ id: string }>
}

// Configurações de prioridade e status das tarefas
const priorityConfig = {
    LOW: { label: "Baixa", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    MEDIUM: { label: "Média", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
    HIGH: { label: "Alta", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
    URGENT: { label: "Urgente", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
}

const taskStatusConfig = {
    TODO: { label: "A Fazer", icon: Circle, color: "text-gray-500" },
    IN_PROGRESS: { label: "Em Progresso", icon: Clock, color: "text-blue-500" },
    COMPLETED: { label: "Concluída", icon: CheckCircle2, color: "text-green-500" },
    CANCELLED: { label: "Cancelada", icon: AlertCircle, color: "text-red-500" },
}

async function DealDetails({ id }: { id: string }) {
    const result = await getDealById(id)

    if (!result.success || !result.data) {
        notFound()
    }

    const deal = result.data

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
            OPEN: { label: "Aberto", variant: "default" },
            WON: { label: "Ganho", variant: "secondary" },
            LOST: { label: "Perdido", variant: "destructive" },
            ABANDONED: { label: "Abandonado", variant: "outline" },
        }
        const config = statusConfig[status] || statusConfig.OPEN
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    // Separar tarefas por status
    const tasks = deal.tasks || []
    const pendingTasks = tasks.filter((t: any) => t.status === "TODO" || t.status === "IN_PROGRESS")
    const completedTasks = tasks.filter((t: any) => t.status === "COMPLETED")
    const overdueTasks = pendingTasks.filter((t: any) => {
        if (!t.dueDate) return false
        const dueDate = new Date(t.dueDate)
        return isPast(dueDate) && !isToday(dueDate)
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/deals">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <Briefcase className="h-6 w-6" />
                            <h1 className="text-3xl font-bold">{deal.title}</h1>
                            {getStatusBadge(deal.status)}
                        </div>
                        {deal.stage && (
                            <div className="flex items-center gap-2 mt-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: deal.stage.color }}
                                />
                                <span className="text-muted-foreground">{deal.stage.name}</span>
                            </div>
                        )}
                    </div>
                </div>
                <DealActions deal={deal} />
            </div>

            {/* Cards de resumo */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Valor do Deal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {deal.value ? formatCurrency(deal.value) : "—"}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Probabilidade
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{deal.probability ?? 0}%</div>
                        <Progress value={deal.probability ?? 0} className="h-2 mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tarefas Pendentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingTasks.length}</div>
                        {overdueTasks.length > 0 && (
                            <p className="text-xs text-red-500 mt-1">
                                {overdueTasks.length} atrasada{overdueTasks.length !== 1 ? "s" : ""}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tarefas Concluídas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            de {tasks.length} total
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Informações principais */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Informações do Deal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Datas */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                    Data Prevista de Fechamento
                                </p>
                                <p className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {deal.expectedCloseDate
                                        ? format(new Date(deal.expectedCloseDate), "dd/MM/yyyy", { locale: ptBR })
                                        : "Não definida"
                                    }
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                    Criado em
                                </p>
                                <p className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    {format(new Date(deal.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                            </div>
                        </div>

                        {/* Descrição */}
                        {deal.description && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                        Descrição
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap">{deal.description}</p>
                                </div>
                            </>
                        )}

                        {/* Motivo da perda */}
                        {deal.status === "LOST" && deal.lostReason && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-destructive mb-2">
                                        Motivo da Perda
                                    </p>
                                    <p className="text-sm">{deal.lostReason}</p>
                                </div>
                            </>
                        )}

                        {/* Data de fechamento */}
                        {deal.closedAt && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                        {deal.status === "WON" ? "Fechado em" : "Perdido em"}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {format(new Date(deal.closedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Valor Ponderado */}
                        <Separator />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                                Valor Ponderado (Valor × Probabilidade)
                            </p>
                            <p className="text-xl font-bold text-primary">
                                {deal.value
                                    ? formatCurrency((deal.value * (deal.probability ?? 0)) / 100)
                                    : "R$ 0,00"
                                }
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar com vínculos */}
                <div className="space-y-6">
                    {/* Empresa */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Empresa
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {deal.company ? (
                                <Link
                                    href={`/companies/${deal.company.id}`}
                                    className="text-primary hover:underline font-medium"
                                >
                                    {deal.company.name}
                                </Link>
                            ) : (
                                <p className="text-sm text-muted-foreground">Nenhuma empresa vinculada</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contato */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Contato
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {deal.contact ? (
                                <div>
                                    <Link
                                        href={`/contacts/${deal.contact.id}`}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        {deal.contact.firstName} {deal.contact.lastName}
                                    </Link>
                                    {deal.contact.email && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {deal.contact.email}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Nenhum contato vinculado</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Seção de Tarefas */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CheckSquare className="h-5 w-5" />
                            Tarefas Vinculadas
                        </CardTitle>
                        <CardDescription>
                            {tasks.length === 0
                                ? "Nenhuma tarefa vinculada a este deal"
                                : `${pendingTasks.length} pendente${pendingTasks.length !== 1 ? "s" : ""}, ${completedTasks.length} concluída${completedTasks.length !== 1 ? "s" : ""}`
                            }
                        </CardDescription>
                    </div>
                    <Button asChild>
                        <Link href={`/tasks?dealId=${deal.id}`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Tarefa
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {tasks.length > 0 ? (
                        <div className="space-y-3">
                            {/* Tarefas Atrasadas */}
                            {overdueTasks.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Atrasadas ({overdueTasks.length})
                                    </h4>
                                    {overdueTasks.map((task: any) => (
                                        <TaskItem key={task.id} task={task} />
                                    ))}
                                </div>
                            )}

                            {/* Tarefas Pendentes (não atrasadas) */}
                            {pendingTasks.filter((t: any) => !overdueTasks.includes(t)).length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Pendentes ({pendingTasks.length - overdueTasks.length})
                                    </h4>
                                    {pendingTasks
                                        .filter((t: any) => !overdueTasks.includes(t))
                                        .map((task: any) => (
                                            <TaskItem key={task.id} task={task} />
                                        ))}
                                </div>
                            )}

                            {/* Tarefas Concluídas */}
                            {completedTasks.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-green-600 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Concluídas ({completedTasks.length})
                                    </h4>
                                    {completedTasks.map((task: any) => (
                                        <TaskItem key={task.id} task={task} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <CheckSquare className="h-12 w-12 mb-4 opacity-50" />
                            <p>Nenhuma tarefa vinculada a este deal</p>
                            <Button variant="outline" className="mt-4" asChild>
                                <Link href={`/tasks?dealId=${deal.id}`}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Criar primeira tarefa
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// Componente para exibir uma tarefa
function TaskItem({ task }: { task: any }) {
    const StatusIcon = taskStatusConfig[task.status as keyof typeof taskStatusConfig]?.icon || Circle
    const statusColor = taskStatusConfig[task.status as keyof typeof taskStatusConfig]?.color || "text-gray-500"

    const isCompleted = task.status === "COMPLETED"
    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !isCompleted

    return (
        <Link
            href={`/tasks/${task.id}`}
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors",
                isCompleted && "opacity-60",
                isOverdue && "border-red-300 dark:border-red-800"
            )}
        >
            <StatusIcon className={cn("h-5 w-5 flex-shrink-0", statusColor)} />

            <div className="flex-1 min-w-0">
                <p className={cn(
                    "font-medium truncate",
                    isCompleted && "line-through text-muted-foreground"
                )}>
                    {task.title}
                </p>
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
                        <span className={cn(
                            "text-xs flex items-center gap-1",
                            isOverdue ? "text-red-500" : "text-muted-foreground"
                        )}>
                            <Calendar className="h-3 w-3" />
                            {isToday(new Date(task.dueDate))
                                ? "Hoje"
                                : format(new Date(task.dueDate), "dd/MM", { locale: ptBR })
                            }
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}

function DealLoading() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Carregando deal...</p>
            </div>
        </div>
    )
}

export default async function DealPage({ params }: Props) {
    const { id } = await params

    return (
        <Suspense fallback={<DealLoading />}>
            <DealDetails id={id} />
        </Suspense>
    )
}