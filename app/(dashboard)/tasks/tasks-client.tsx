// app/(dashboard)/tasks/tasks-client.tsx

"use client"

import { useState, useTransition } from "react"
import {
    Plus,
    List,
    LayoutGrid,
    Search,
    Filter,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Circle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { TaskCard } from "@/components/tasks/task-card"
import { TaskModal } from "@/components/tasks/task-modal"
import {
    getTasks,
    updateTaskStatus,
    type TaskWithRelations,
} from "@/actions/tasks"
import { TaskStatus, TaskPriority } from "@prisma/client"

// DnD imports
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from "@dnd-kit/core"
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type TasksClientProps = {
    initialTasks: TaskWithRelations[]
    initialStats: {
        total: number
        todo: number
        inProgress: number
        completed: number
        overdue: number
    }
}

type ViewMode = "list" | "kanban"
type DateFilter = "ALL" | "TODAY" | "WEEK" | "OVERDUE" | "NO_DATE"

const statusColumns = [
    { id: "TODO", label: "A Fazer", icon: Circle, color: "bg-gray-500" },
    { id: "IN_PROGRESS", label: "Em Progresso", icon: Clock, color: "bg-blue-500" },
    { id: "COMPLETED", label: "Concluídas", icon: CheckCircle2, color: "bg-green-500" },
]

// Componente de tarefa arrastável
function DraggableTaskCard({
                               task,
                               onEdit,
                               onUpdate,
                               onDelete,
                           }: {
    task: TaskWithRelations
    onEdit: (task: TaskWithRelations) => void
    onUpdate: (task: TaskWithRelations) => void
    onDelete: (taskId: string) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard
                task={task}
                onEdit={onEdit}
                onUpdate={onUpdate}
                onDelete={onDelete}
                showSubtasks={false}
            />
        </div>
    )
}

// Coluna do Kanban
function KanbanColumn({
                          status,
                          label,
                          icon: Icon,
                          color,
                          tasks,
                          onEdit,
                          onUpdate,
                          onDelete,
                      }: {
    status: string
    label: string
    icon: any
    color: string
    tasks: TaskWithRelations[]
    onEdit: (task: TaskWithRelations) => void
    onUpdate: (task: TaskWithRelations) => void
    onDelete: (taskId: string) => void
}) {
    return (
        <div className="flex flex-col w-80 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3 px-2">
                <div className={cn("w-2 h-2 rounded-full", color)} />
                <h3 className="font-medium">{label}</h3>
                <Badge variant="secondary" className="ml-auto">
                    {tasks.length}
                </Badge>
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-2 p-1 min-h-[200px]">
                    <SortableContext
                        items={tasks.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {tasks.map((task) => (
                            <DraggableTaskCard
                                key={task.id}
                                task={task}
                                onEdit={onEdit}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                            />
                        ))}
                    </SortableContext>

                    {tasks.length === 0 && (
                        <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                            Nenhuma tarefa
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}

export function TasksClient({ initialTasks, initialStats }: TasksClientProps) {
    const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks)
    const [stats, setStats] = useState(initialStats)
    const [viewMode, setViewMode] = useState<ViewMode>("list")
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL")
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">("ALL")
    const [dateFilter, setDateFilter] = useState<DateFilter>("ALL")
    const [modalOpen, setModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null)
    const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null)
    const [isPending, startTransition] = useTransition()

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    // Filtrar tarefas
    const filteredTasks = tasks.filter((task) => {
        // Filtro de busca
        if (search) {
            const searchLower = search.toLowerCase()
            const matchesSearch =
                task.title.toLowerCase().includes(searchLower) ||
                task.description?.toLowerCase().includes(searchLower)
            if (!matchesSearch) return false
        }

        // Filtro de status
        if (statusFilter !== "ALL" && task.status !== statusFilter) {
            return false
        }

        // Filtro de prioridade
        if (priorityFilter !== "ALL" && task.priority !== priorityFilter) {
            return false
        }

        // Filtro de data
        if (dateFilter !== "ALL") {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            const weekEnd = new Date(today)
            weekEnd.setDate(weekEnd.getDate() + 7)

            const dueDate = task.dueDate ? new Date(task.dueDate) : null

            switch (dateFilter) {
                case "TODAY":
                    if (!dueDate || dueDate < today || dueDate >= tomorrow) return false
                    break
                case "WEEK":
                    if (!dueDate || dueDate < today || dueDate >= weekEnd) return false
                    break
                case "OVERDUE":
                    if (
                        !dueDate ||
                        dueDate >= today ||
                        task.status === "COMPLETED" ||
                        task.status === "CANCELLED"
                    )
                        return false
                    break
                case "NO_DATE":
                    if (dueDate) return false
                    break
            }
        }

        return true
    })

    // Agrupar por status para Kanban
    const tasksByStatus = {
        TODO: filteredTasks.filter((t) => t.status === "TODO"),
        IN_PROGRESS: filteredTasks.filter((t) => t.status === "IN_PROGRESS"),
        COMPLETED: filteredTasks.filter((t) => t.status === "COMPLETED"),
    }

    // Agrupar por data para Lista
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdueTasks = filteredTasks.filter((t) => {
        if (!t.dueDate || t.status === "COMPLETED" || t.status === "CANCELLED")
            return false
        return new Date(t.dueDate) < today
    })

    const todayTasks = filteredTasks.filter((t) => {
        if (!t.dueDate) return false
        const due = new Date(t.dueDate)
        due.setHours(0, 0, 0, 0)
        return due.getTime() === today.getTime()
    })

    const upcomingTasks = filteredTasks.filter((t) => {
        if (!t.dueDate) return false
        const due = new Date(t.dueDate)
        due.setHours(0, 0, 0, 0)
        return due > today
    })

    const noDateTasks = filteredTasks.filter((t) => !t.dueDate)

    function handleEdit(task: TaskWithRelations) {
        setEditingTask(task)
        setModalOpen(true)
    }

    function handleUpdate(updatedTask: TaskWithRelations) {
        setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
        )
    }

    function handleDelete(taskId: string) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
        setStats((prev) => ({ ...prev, total: prev.total - 1 }))
    }

    function handleSuccess(task: TaskWithRelations) {
        if (editingTask) {
            // Editou
            handleUpdate(task)
        } else {
            // Criou nova
            setTasks((prev) => [task, ...prev])
            setStats((prev) => ({ ...prev, total: prev.total + 1, todo: prev.todo + 1 }))
        }
        setEditingTask(null)
    }

    function handleDragStart(event: DragStartEvent) {
        const task = tasks.find((t) => t.id === event.active.id)
        setActiveTask(task || null)
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveTask(null)

        const { active, over } = event
        if (!over) return

        const taskId = active.id as string
        const task = tasks.find((t) => t.id === taskId)
        if (!task) return

        // Determinar o novo status baseado em onde foi solto
        let newStatus: TaskStatus | null = null

        // Verificar se foi solto em uma coluna
        if (over.id === "TODO" || over.id === "IN_PROGRESS" || over.id === "COMPLETED") {
            newStatus = over.id as TaskStatus
        } else {
            // Foi solto em outra tarefa, verificar qual coluna
            const overTask = tasks.find((t) => t.id === over.id)
            if (overTask) {
                newStatus = overTask.status
            }
        }

        if (newStatus && newStatus !== task.status) {
            startTransition(async () => {
                const result = await updateTaskStatus(taskId, newStatus!)

                if (result.success && result.data) {
                    handleUpdate(result.data)
                    toast.success(`Tarefa movida para "${statusColumns.find((s) => s.id === newStatus)?.label}"`)
                } else {
                    toast.error("Erro ao mover tarefa")
                }
            })
        }
    }

    function renderTaskGroup(title: string, tasks: TaskWithRelations[], icon: any, variant: "overdue" | "today" | "upcoming" | "nodate") {
        const Icon = icon
        if (tasks.length === 0) return null

        const variantStyles = {
            overdue: "text-red-600 dark:text-red-400",
            today: "text-blue-600 dark:text-blue-400",
            upcoming: "text-green-600 dark:text-green-400",
            nodate: "text-gray-600 dark:text-gray-400",
        }

        return (
            <div className="space-y-2">
                <div className={cn("flex items-center gap-2 font-medium", variantStyles[variant])}>
                    <Icon className="h-4 w-4" />
                    <span>{title}</span>
                    <Badge variant="secondary">{tasks.length}</Badge>
                </div>
                <div className="space-y-2">
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={handleEdit}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header com Stats */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Tarefas</h1>
                    <p className="text-muted-foreground">
                        Gerencie suas tarefas e acompanhe o progresso
                    </p>
                </div>
                <Button onClick={() => { setEditingTask(null); setModalOpen(true) }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Tarefa
                </Button>
            </div>

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            A Fazer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">{stats.todo}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Em Progresso
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Concluídas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    </CardContent>
                </Card>
                <Card className={cn(stats.overdue > 0 && "border-red-300 dark:border-red-800")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Atrasadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", stats.overdue > 0 ? "text-red-600" : "text-gray-600")}>
                            {stats.overdue}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros e Toggle de Visualização */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    {/* Busca */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar tarefas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Status */}
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v as TaskStatus | "ALL")}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos</SelectItem>
                            <SelectItem value="TODO">A Fazer</SelectItem>
                            <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                            <SelectItem value="COMPLETED">Concluídas</SelectItem>
                            <SelectItem value="CANCELLED">Canceladas</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Prioridade */}
                    <Select
                        value={priorityFilter}
                        onValueChange={(v) => setPriorityFilter(v as TaskPriority | "ALL")}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todas</SelectItem>
                            <SelectItem value="LOW">Baixa</SelectItem>
                            <SelectItem value="MEDIUM">Média</SelectItem>
                            <SelectItem value="HIGH">Alta</SelectItem>
                            <SelectItem value="URGENT">Urgente</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Data */}
                    <Select
                        value={dateFilter}
                        onValueChange={(v) => setDateFilter(v as DateFilter)}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Vencimento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Qualquer data</SelectItem>
                            <SelectItem value="TODAY">Hoje</SelectItem>
                            <SelectItem value="WEEK">Próximos 7 dias</SelectItem>
                            <SelectItem value="OVERDUE">Atrasadas</SelectItem>
                            <SelectItem value="NO_DATE">Sem data</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Toggle Lista/Kanban */}
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                    <TabsList>
                        <TabsTrigger value="list" className="gap-2">
                            <List className="h-4 w-4" />
                            Lista
                        </TabsTrigger>
                        <TabsTrigger value="kanban" className="gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            Kanban
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Conteúdo */}
            {viewMode === "list" ? (
                /* Visualização em Lista */
                <div className="space-y-6">
                    {filteredTasks.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">Nenhuma tarefa encontrada</h3>
                                <p className="text-muted-foreground text-center mt-1">
                                    {search || statusFilter !== "ALL" || priorityFilter !== "ALL" || dateFilter !== "ALL"
                                        ? "Tente ajustar os filtros"
                                        : "Crie sua primeira tarefa para começar"}
                                </p>
                                {!search && statusFilter === "ALL" && priorityFilter === "ALL" && dateFilter === "ALL" && (
                                    <Button
                                        className="mt-4"
                                        onClick={() => { setEditingTask(null); setModalOpen(true) }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Nova Tarefa
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {renderTaskGroup("Atrasadas", overdueTasks, AlertTriangle, "overdue")}
                            {renderTaskGroup("Hoje", todayTasks, Calendar, "today")}
                            {renderTaskGroup("Próximas", upcomingTasks, Clock, "upcoming")}
                            {renderTaskGroup("Sem data", noDateTasks, Circle, "nodate")}
                        </>
                    )}
                </div>
            ) : (
                /* Visualização Kanban */
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {statusColumns.map((column) => (
                            <KanbanColumn
                                key={column.id}
                                status={column.id}
                                label={column.label}
                                icon={column.icon}
                                color={column.color}
                                tasks={tasksByStatus[column.id as keyof typeof tasksByStatus]}
                                onEdit={handleEdit}
                                onUpdate={handleUpdate}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeTask && (
                            <div className="rotate-3 opacity-90">
                                <TaskCard
                                    task={activeTask}
                                    onEdit={() => {}}
                                    onUpdate={() => {}}
                                    onDelete={() => {}}
                                    showSubtasks={false}
                                />
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Modal */}
            <TaskModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                task={editingTask}
                onSuccess={handleSuccess}
            />
        </div>
    )
}