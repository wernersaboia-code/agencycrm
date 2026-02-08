// components/tasks/task-card.tsx

"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    MoreHorizontal,
    Pencil,
    Trash2,
    User,
    Building2,
    Briefcase,
    AlertCircle,
    ChevronDown,
    ChevronRight,
    ExternalLink,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import {
    updateTaskStatus,
    deleteTask,
    toggleSubtask,
    type TaskWithRelations,
} from "@/actions/tasks"

type TaskCardProps = {
    task: TaskWithRelations
    onEdit: (task: TaskWithRelations) => void
    onUpdate: (task: TaskWithRelations) => void
    onDelete: (taskId: string) => void
    showSubtasks?: boolean
}

const priorityConfig = {
    LOW: { label: "Baixa", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    MEDIUM: { label: "Média", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
    HIGH: { label: "Alta", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
    URGENT: { label: "Urgente", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
}

const statusConfig = {
    TODO: { label: "A Fazer", icon: Circle },
    IN_PROGRESS: { label: "Em Progresso", icon: Clock },
    COMPLETED: { label: "Concluída", icon: CheckCircle2 },
    CANCELLED: { label: "Cancelada", icon: AlertCircle },
}

export function TaskCard({
                             task,
                             onEdit,
                             onUpdate,
                             onDelete,
                             showSubtasks = true,
                         }: TaskCardProps) {
    const [isPending, startTransition] = useTransition()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [subtasksExpanded, setSubtasksExpanded] = useState(false)

    const isCompleted = task.status === "COMPLETED"
    const isCancelled = task.status === "CANCELLED"
    const isOverdue =
        task.dueDate &&
        isPast(new Date(task.dueDate)) &&
        !isCompleted &&
        !isCancelled

    const completedSubtasks = task.subtasks.filter((s) => s.completed).length
    const totalSubtasks = task.subtasks.length
    const subtaskProgress =
        totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

    function formatDueDate(dateStr: string) {
        const date = new Date(dateStr)
        if (isToday(date)) return "Hoje"
        if (isTomorrow(date)) return "Amanhã"
        return format(date, "dd MMM", { locale: ptBR })
    }

    function handleToggleComplete(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()

        startTransition(async () => {
            const newStatus = isCompleted ? "TODO" : "COMPLETED"
            const result = await updateTaskStatus(task.id, newStatus)

            if (result.success && result.data) {
                onUpdate(result.data)
                toast.success(
                    newStatus === "COMPLETED"
                        ? "Tarefa concluída!"
                        : "Tarefa reaberta!"
                )
            } else {
                toast.error("Erro ao atualizar tarefa")
            }
        })
    }

    function handleToggleSubtask(e: React.MouseEvent, subtaskId: string) {
        e.preventDefault()
        e.stopPropagation()

        startTransition(async () => {
            const result = await toggleSubtask(subtaskId)

            if (result.success) {
                const updatedSubtasks = task.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s
                )
                onUpdate({
                    ...task,
                    subtasks: updatedSubtasks,
                })
            } else {
                toast.error("Erro ao atualizar subtarefa")
            }
        })
    }

    function handleDelete() {
        startTransition(async () => {
            const result = await deleteTask(task.id)

            if (result.success) {
                toast.success("Tarefa excluída!")
                onDelete(task.id)
            } else {
                toast.error("Erro ao excluir tarefa")
            }
            setShowDeleteDialog(false)
        })
    }

    return (
        <>
            <div
                className={cn(
                    "group relative p-4 rounded-lg border bg-card transition-all hover:shadow-md",
                    isCompleted && "opacity-60",
                    isCancelled && "opacity-50",
                    isOverdue && "border-red-300 dark:border-red-800"
                )}
            >
                <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                        onClick={handleToggleComplete}
                        disabled={isPending || isCancelled}
                        className="mt-0.5 flex-shrink-0"
                    >
                        {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                            <Circle
                                className={cn(
                                    "h-5 w-5 text-muted-foreground hover:text-primary transition-colors",
                                    isOverdue && "text-red-500"
                                )}
                            />
                        )}
                    </button>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                        {/* Título e Menu */}
                        <div className="flex items-start justify-between gap-2">
                            {/* TÍTULO CLICÁVEL - LINK PARA DETALHES */}
                            <Link
                                href={`/tasks/${task.id}`}
                                className={cn(
                                    "font-medium leading-tight hover:text-primary hover:underline transition-colors",
                                    isCompleted && "line-through text-muted-foreground"
                                )}
                            >
                                {task.title}
                            </Link>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/tasks/${task.id}`}>
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Ver detalhes
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEdit(task)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Descrição */}
                        {task.description && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                {task.description}
                            </p>
                        )}

                        {/* Meta info */}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {/* Prioridade */}
                            <Badge variant="secondary" className={priorityConfig[task.priority].color}>
                                {priorityConfig[task.priority].label}
                            </Badge>

                            {/* Data */}
                            {task.dueDate && (
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "gap-1",
                                        isOverdue && "border-red-500 text-red-500"
                                    )}
                                >
                                    <Calendar className="h-3 w-3" />
                                    {formatDueDate(task.dueDate)}
                                </Badge>
                            )}

                            {/* Subtarefas */}
                            {totalSubtasks > 0 && (
                                <Badge variant="outline" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {completedSubtasks}/{totalSubtasks}
                                </Badge>
                            )}
                        </div>

                        {/* Vínculos */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {task.contact && (
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {task.contact.firstName} {task.contact.lastName}
                                </span>
                            )}
                            {task.company && (
                                <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {task.company.name}
                                </span>
                            )}
                            {task.deal && (
                                <span className="flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" />
                                    {task.deal.title}
                                </span>
                            )}
                        </div>

                        {/* Subtarefas expandíveis */}
                        {showSubtasks && totalSubtasks > 0 && (
                            <div className="mt-3">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setSubtasksExpanded(!subtasksExpanded)
                                    }}
                                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {subtasksExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                    Subtarefas ({completedSubtasks}/{totalSubtasks})
                                </button>

                                {subtasksExpanded && (
                                    <div className="mt-2 space-y-1 pl-5">
                                        {task.subtasks.map((subtask) => (
                                            <div
                                                key={subtask.id}
                                                className="flex items-center gap-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Checkbox
                                                    checked={subtask.completed}
                                                    onCheckedChange={() => {}}
                                                    onClick={(e) => handleToggleSubtask(e, subtask.id)}
                                                    disabled={isPending}
                                                />
                                                <span
                                                    className={cn(
                                                        "text-sm",
                                                        subtask.completed &&
                                                        "line-through text-muted-foreground"
                                                    )}
                                                >
                                                    {subtask.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Barra de progresso */}
                                {!subtasksExpanded && (
                                    <Progress value={subtaskProgress} className="mt-2 h-1" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dialog de confirmação de exclusão */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir "{task.title}"? Esta ação não pode
                            ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}