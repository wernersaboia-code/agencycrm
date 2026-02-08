// app/(dashboard)/tasks/[id]/page.tsx

import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    ArrowLeft,
    Calendar,
    User,
    Building2,
    Briefcase,
    Clock,
    CheckCircle2,
    Circle,
    AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { getTaskById } from "@/actions/tasks"
import { cn } from "@/lib/utils"
import { TaskDetailActions } from "./task-detail-actions"
import { SubtasksList } from "./subtasks-list"

const priorityConfig = {
    LOW: { label: "Baixa", color: "bg-gray-100 text-gray-700" },
    MEDIUM: { label: "Média", color: "bg-blue-100 text-blue-700" },
    HIGH: { label: "Alta", color: "bg-orange-100 text-orange-700" },
    URGENT: { label: "Urgente", color: "bg-red-100 text-red-700" },
}

const statusConfig = {
    TODO: { label: "A Fazer", icon: Circle, color: "text-gray-500" },
    IN_PROGRESS: { label: "Em Progresso", icon: Clock, color: "text-blue-500" },
    COMPLETED: { label: "Concluída", icon: CheckCircle2, color: "text-green-500" },
    CANCELLED: { label: "Cancelada", icon: AlertCircle, color: "text-red-500" },
}

export default async function TaskDetailPage({
                                                 params,
                                             }: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const result = await getTaskById(id)

    if (!result.success || !result.data) {
        notFound()
    }

    const task = result.data
    const StatusIcon = statusConfig[task.status].icon

    const isOverdue =
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== "COMPLETED" &&
        task.status !== "CANCELLED"

    const completedSubtasks = task.subtasks.filter((s) => s.completed).length
    const totalSubtasks = task.subtasks.length
    const subtaskProgress =
        totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/tasks">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <StatusIcon
                            className={cn("h-6 w-6", statusConfig[task.status].color)}
                        />
                        <h1
                            className={cn(
                                "text-2xl font-bold",
                                task.status === "COMPLETED" && "line-through text-muted-foreground"
                            )}
                        >
                            {task.title}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge className={priorityConfig[task.priority].color}>
                            {priorityConfig[task.priority].label}
                        </Badge>
                        <Badge variant="outline">{statusConfig[task.status].label}</Badge>
                        {isOverdue && (
                            <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Atrasada
                            </Badge>
                        )}
                    </div>
                </div>
                <TaskDetailActions task={task} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Coluna Principal */}
                <div className="md:col-span-2 space-y-6">
                    {/* Descrição */}
                    {task.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Descrição</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-muted-foreground">
                                    {task.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Subtarefas */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Subtarefas</CardTitle>
                                {totalSubtasks > 0 && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {completedSubtasks} de {totalSubtasks} concluídas
                                    </p>
                                )}
                            </div>
                            {totalSubtasks > 0 && (
                                <span className="text-sm font-medium">
                  {Math.round(subtaskProgress)}%
                </span>
                            )}
                        </CardHeader>
                        <CardContent>
                            {totalSubtasks > 0 && (
                                <Progress value={subtaskProgress} className="mb-4" />
                            )}
                            <SubtasksList taskId={task.id} subtasks={task.subtasks} />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Detalhes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Detalhes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Data de vencimento */}
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Vencimento</p>
                                    <p className={cn("font-medium", isOverdue && "text-red-500")}>
                                        {task.dueDate
                                            ? format(new Date(task.dueDate), "PPP", { locale: ptBR })
                                            : "Sem data definida"}
                                    </p>
                                </div>
                            </div>

                            {task.completedAt && (
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Concluída em</p>
                                        <p className="font-medium">
                                            {format(new Date(task.completedAt), "PPP", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <Separator />

                            {/* Criada por */}
                            <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Criada por</p>
                                    <p className="font-medium">
                                        {task.createdBy.name || task.createdBy.email}
                                    </p>
                                </div>
                            </div>

                            {/* Criada em */}
                            <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Criada em</p>
                                    <p className="font-medium">
                                        {format(new Date(task.createdAt), "PPP", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vínculos */}
                    {(task.contact || task.company || task.deal) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Vínculos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {task.contact && (
                                    <Link
                                        href={`/contacts/${task.contact.id}`}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Contato</p>
                                            <p className="font-medium">
                                                {task.contact.firstName} {task.contact.lastName}
                                            </p>
                                        </div>
                                    </Link>
                                )}

                                {task.company && (
                                    <Link
                                        href={`/companies/${task.company.id}`}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Empresa</p>
                                            <p className="font-medium">{task.company.name}</p>
                                        </div>
                                    </Link>
                                )}

                                {task.deal && (
                                    <Link
                                        href={`/deals/${task.deal.id}`}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Deal</p>
                                            <p className="font-medium">{task.deal.title}</p>
                                        </div>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}