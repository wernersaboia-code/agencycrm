// app/(dashboard)/contacts/[id]/page.tsx

import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    ArrowLeft,
    Mail,
    Phone,
    Smartphone,
    Building2,
    Briefcase,
    CheckSquare,
    User,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ExternalLink,
    MapPin,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { ContactActions } from "./contact-actions"

// Função para serializar deals
function serializeDeal(deal: any) {
    return {
        ...deal,
        value: deal.value ? Number(deal.value) : null,
        createdAt: deal.createdAt?.toISOString?.() || deal.createdAt,
        updatedAt: deal.updatedAt?.toISOString?.() || deal.updatedAt,
        expectedCloseDate: deal.expectedCloseDate?.toISOString?.() || deal.expectedCloseDate,
        closedAt: deal.closedAt?.toISOString?.() || deal.closedAt,
    }
}

// Função para serializar tasks
function serializeTask(task: any) {
    return {
        ...task,
        dueDate: task.dueDate?.toISOString?.() || task.dueDate,
        completedAt: task.completedAt?.toISOString?.() || task.completedAt,
        createdAt: task.createdAt?.toISOString?.() || task.createdAt,
        updatedAt: task.updatedAt?.toISOString?.() || task.updatedAt,
    }
}

// Função para serializar o contato para o ContactActions
function serializeContactForActions(contact: any) {
    return {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        position: contact.position,
        department: contact.department,
        status: contact.status,
        source: contact.source,
        notes: contact.notes,
        avatar: contact.avatar,
        companyId: contact.companyId,
        assignedToId: contact.assignedToId,
        createdById: contact.createdById,
        createdAt: contact.createdAt?.toISOString?.() || contact.createdAt,
        updatedAt: contact.updatedAt?.toISOString?.() || contact.updatedAt,
    }
}

async function getContact(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const contact = await prisma.contact.findFirst({
        where: {
            id,
            OR: [
                { createdById: user.id },
                { assignedToId: user.id },
            ],
        },
        include: {
            company: {
                select: {
                    id: true,
                    name: true,
                    industry: true,
                    website: true,
                },
            },
            deals: {
                include: {
                    stage: {
                        select: { name: true, color: true },
                    },
                    company: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            },
            tasks: {
                include: {
                    company: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: [
                    { status: "asc" },
                    { dueDate: "asc" },
                ],
            },
        },
    })

    return contact
}

const statusConfig: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: "Ativo", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
    INACTIVE: { label: "Inativo", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
    LEAD: { label: "Lead", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
    CUSTOMER: { label: "Cliente", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
    CHURNED: { label: "Perdido", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
}

const dealStatusConfig = {
    OPEN: { label: "Aberto", icon: Clock, color: "text-blue-500" },
    WON: { label: "Ganho", icon: CheckCircle2, color: "text-green-500" },
    LOST: { label: "Perdido", icon: XCircle, color: "text-red-500" },
    ABANDONED: { label: "Abandonado", icon: AlertTriangle, color: "text-gray-500" },
}

const taskStatusConfig = {
    TODO: { label: "A Fazer", color: "bg-gray-100 text-gray-700" },
    IN_PROGRESS: { label: "Em Progresso", color: "bg-blue-100 text-blue-700" },
    COMPLETED: { label: "Concluída", color: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-700" },
}

function formatCurrency(value: number | null) {
    if (!value) return "R$ 0,00"
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value)
}

export default async function ContactPage({
                                              params,
                                          }: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const contact = await getContact(id)

    if (!contact) {
        notFound()
    }

    // Serializar deals e tasks
    const deals = contact.deals.map(serializeDeal)
    const tasks = contact.tasks.map(serializeTask)

    // Separar deals por status
    const openDeals = deals.filter((d) => d.status === "OPEN")
    const wonDeals = deals.filter((d) => d.status === "WON")
    const lostDeals = deals.filter((d) => d.status === "LOST")

    // Calcular totais
    const totalOpenValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0)
    const totalWonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0)

    // Separar tasks
    const pendingTasks = tasks.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS")
    const completedTasks = tasks.filter((t) => t.status === "COMPLETED")

    // Verificar tarefas atrasadas
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const overdueTasks = pendingTasks.filter((t) => {
        if (!t.dueDate) return false
        return new Date(t.dueDate) < today
    })

    const fullName = `${contact.firstName} ${contact.lastName}`

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/contacts">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>

                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                {contact.firstName[0]}
                                {contact.lastName?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">{fullName}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                {contact.position && (
                                    <span className="text-muted-foreground">{contact.position}</span>
                                )}
                                {contact.position && contact.company && (
                                    <span className="text-muted-foreground">•</span>
                                )}
                                {contact.company && (
                                    <Link
                                        href={`/companies/${contact.company.id}`}
                                        className="text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Building2 className="h-3 w-3" />
                                        {contact.company.name}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Badge className={statusConfig[contact.status]?.color}>
                    {statusConfig[contact.status]?.label || contact.status}
                </Badge>

                <ContactActions contact={serializeContactForActions(contact) as any} />
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Em Negociação
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{openDeals.length}</div>
                        <p className="text-xs text-muted-foreground">{formatCurrency(totalOpenValue)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Ganhos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{wonDeals.length}</div>
                        <p className="text-xs text-muted-foreground">{formatCurrency(totalWonValue)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            Perdidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{lostDeals.length}</div>
                    </CardContent>
                </Card>

                <Card className={cn(overdueTasks.length > 0 && "border-red-300 dark:border-red-800")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckSquare className="h-4 w-4" />
                            Tarefas Pendentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", overdueTasks.length > 0 ? "text-red-600" : "")}>
                            {pendingTasks.length}
                        </div>
                        {overdueTasks.length > 0 && (
                            <p className="text-xs text-red-500">{overdueTasks.length} atrasada(s)</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Coluna Principal */}
                <div className="md:col-span-2 space-y-6">
                    {/* Deals */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Briefcase className="h-5 w-5" />
                                Deals
                            </CardTitle>
                            <Button size="sm" asChild>
                                <Link href={`/deals?contactId=${contact.id}`}>
                                    Ver Pipeline
                                    <ExternalLink className="ml-2 h-3 w-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {deals.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">
                                    Nenhum deal vinculado a este contato
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {/* Deals Abertos */}
                                    {openDeals.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-blue-500" />
                                                Em Negociação ({openDeals.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {openDeals.map((deal) => (
                                                    <Link
                                                        key={deal.id}
                                                        href={`/deals/${deal.id}`}
                                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: deal.stage?.color || "#6B7280" }}
                                                            />
                                                            <div>
                                                                <p className="font-medium">{deal.title}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {deal.stage?.name || "Sem estágio"}
                                                                    {deal.company && ` • ${deal.company.name}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-medium">{formatCurrency(deal.value)}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {deal.probability}% probabilidade
                                                            </p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Deals Ganhos */}
                                    {wonDeals.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                Ganhos ({wonDeals.length}) - {formatCurrency(totalWonValue)}
                                            </h4>
                                            <div className="space-y-2">
                                                {wonDeals.slice(0, 3).map((deal) => (
                                                    <Link
                                                        key={deal.id}
                                                        href={`/deals/${deal.id}`}
                                                        className="flex items-center justify-between p-3 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                            <div>
                                                                <p className="font-medium">{deal.title}</p>
                                                                {deal.closedAt && (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Fechado em {format(new Date(deal.closedAt), "dd/MM/yyyy", { locale: ptBR })}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="font-medium text-green-600">{formatCurrency(deal.value)}</p>
                                                    </Link>
                                                ))}
                                                {wonDeals.length > 3 && (
                                                    <p className="text-sm text-muted-foreground text-center pt-2">
                                                        + {wonDeals.length - 3} outros deals ganhos
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Deals Perdidos */}
                                    {lostDeals.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                <XCircle className="h-4 w-4 text-red-500" />
                                                Perdidos ({lostDeals.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {lostDeals.slice(0, 2).map((deal) => (
                                                    <Link
                                                        key={deal.id}
                                                        href={`/deals/${deal.id}`}
                                                        className="flex items-center justify-between p-3 rounded-lg border opacity-60 hover:opacity-100 transition-opacity"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <XCircle className="h-4 w-4 text-red-500" />
                                                            <div>
                                                                <p className="font-medium line-through">{deal.title}</p>
                                                                {deal.lostReason && (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {deal.lostReason}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="font-medium text-muted-foreground">{formatCurrency(deal.value)}</p>
                                                    </Link>
                                                ))}
                                                {lostDeals.length > 2 && (
                                                    <p className="text-sm text-muted-foreground text-center pt-2">
                                                        + {lostDeals.length - 2} outros deals perdidos
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tarefas */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckSquare className="h-5 w-5" />
                                Tarefas
                            </CardTitle>
                            <Button size="sm" variant="outline" asChild>
                                <Link href={`/tasks?contactId=${contact.id}`}>
                                    Ver Todas
                                    <ExternalLink className="ml-2 h-3 w-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {tasks.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">
                                    Nenhuma tarefa vinculada a este contato
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {/* Tarefas Pendentes */}
                                    {pendingTasks.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                                Pendentes ({pendingTasks.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {pendingTasks.slice(0, 5).map((task) => {
                                                    const isOverdue = task.dueDate && new Date(task.dueDate) < today
                                                    return (
                                                        <Link
                                                            key={task.id}
                                                            href={`/tasks/${task.id}`}
                                                            className={cn(
                                                                "flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors",
                                                                isOverdue && "border-red-300 dark:border-red-800"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={cn(
                                                                        "w-2 h-2 rounded-full",
                                                                        task.priority === "URGENT" && "bg-red-500",
                                                                        task.priority === "HIGH" && "bg-orange-500",
                                                                        task.priority === "MEDIUM" && "bg-blue-500",
                                                                        task.priority === "LOW" && "bg-gray-500"
                                                                    )}
                                                                />
                                                                <div>
                                                                    <p className="font-medium">{task.title}</p>
                                                                    {task.company && (
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {task.company.name}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <Badge className={taskStatusConfig[task.status as keyof typeof taskStatusConfig].color}>
                                                                    {taskStatusConfig[task.status as keyof typeof taskStatusConfig].label}
                                                                </Badge>
                                                                {task.dueDate && (
                                                                    <p className={cn(
                                                                        "text-xs mt-1",
                                                                        isOverdue ? "text-red-500" : "text-muted-foreground"
                                                                    )}>
                                                                        {format(new Date(task.dueDate), "dd/MM", { locale: ptBR })}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </Link>
                                                    )
                                                })}
                                                {pendingTasks.length > 5 && (
                                                    <p className="text-sm text-muted-foreground text-center pt-2">
                                                        + {pendingTasks.length - 5} outras tarefas pendentes
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tarefas Concluídas */}
                                    {completedTasks.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                                Concluídas ({completedTasks.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {completedTasks.slice(0, 3).map((task) => (
                                                    <Link
                                                        key={task.id}
                                                        href={`/tasks/${task.id}`}
                                                        className="flex items-center justify-between p-3 rounded-lg border opacity-60 hover:opacity-100 transition-opacity"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                            <p className="font-medium line-through">{task.title}</p>
                                                        </div>
                                                        {task.completedAt && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {format(new Date(task.completedAt), "dd/MM", { locale: ptBR })}
                                                            </p>
                                                        )}
                                                    </Link>
                                                ))}
                                                {completedTasks.length > 3 && (
                                                    <p className="text-sm text-muted-foreground text-center pt-2">
                                                        + {completedTasks.length - 3} outras concluídas
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notas */}
                    {contact.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Notas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-muted-foreground">
                                    {contact.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Informações de Contato */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Informações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {contact.email && (
                                <a
                                    href={`mailto:${contact.email}`}
                                    className="flex items-center gap-3 hover:text-primary transition-colors"
                                >
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    {contact.email}
                                </a>
                            )}

                            {contact.phone && (
                                <a
                                    href={`tel:${contact.phone}`}
                                    className="flex items-center gap-3 hover:text-primary transition-colors"
                                >
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {contact.phone}
                                </a>
                            )}

                            {contact.mobile && (
                                <a
                                    href={`tel:${contact.mobile}`}
                                    className="flex items-center gap-3 hover:text-primary transition-colors"
                                >
                                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                                    {contact.mobile}
                                </a>
                            )}

                            {contact.department && (
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span>{contact.department}</span>
                                </div>
                            )}

                            {contact.source && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Origem</p>
                                        <p>{contact.source}</p>
                                    </div>
                                </>
                            )}

                            <Separator />

                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Cadastrado em</p>
                                <p className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {format(new Date(contact.createdAt), "PPP", { locale: ptBR })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Empresa */}
                    {contact.company && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Empresa
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Link
                                    href={`/companies/${contact.company.id}`}
                                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {contact.company.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium">{contact.company.name}</p>
                                        {contact.company.industry && (
                                            <p className="text-sm text-muted-foreground">
                                                {contact.company.industry}
                                            </p>
                                        )}
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}