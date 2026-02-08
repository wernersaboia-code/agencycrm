// app/(dashboard)/companies/[id]/page.tsx

import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    ArrowLeft,
    Building2,
    Globe,
    Mail,
    Phone,
    MapPin,
    Users,
    Briefcase,
    CheckSquare,
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle2,
    XCircle,
    Calendar,
    AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { CompanyActions } from "./company-actions"

// Função para serializar a company para o CompanyActions
function serializeCompanyForActions(company: any) {
    return {
        id: company.id,
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        size: company.size,
        website: company.website,
        phone: company.phone,
        email: company.email,
        address: company.address,
        city: company.city,
        state: company.state,
        country: company.country,
        postalCode: company.postalCode,
        description: company.description,
        logo: company.logo,
        createdAt: company.createdAt?.toISOString?.() || company.createdAt,
        updatedAt: company.updatedAt?.toISOString?.() || company.updatedAt,
        assignedToId: company.assignedToId,
        _count: company._count,
    }
}

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

async function getCompany(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const company = await prisma.company.findFirst({
        where: {
            id,
            assignedToId: user.id,
        },
        include: {
            contacts: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    position: true,
                    status: true,
                },
                orderBy: { firstName: "asc" },
            },
            deals: {
                include: {
                    stage: {
                        select: { name: true, color: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            },
            tasks: {
                include: {
                    contact: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
                orderBy: [
                    { status: "asc" },
                    { dueDate: "asc" },
                ],
            },
            _count: {
                select: {
                    contacts: true,
                    deals: true,
                    tasks: true,
                },
            },
        },
    })

    return company
}

const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    LEAD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    CUSTOMER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    CHURNED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
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

const taskPriorityConfig = {
    LOW: { label: "Baixa", color: "text-gray-500" },
    MEDIUM: { label: "Média", color: "text-blue-500" },
    HIGH: { label: "Alta", color: "text-orange-500" },
    URGENT: { label: "Urgente", color: "text-red-500" },
}

function formatCurrency(value: number | null) {
    if (!value) return "R$ 0,00"
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value)
}

export default async function CompanyPage({
                                              params,
                                          }: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const company = await getCompany(id)

    if (!company) {
        notFound()
    }

    // Serializar deals e tasks
    const deals = company.deals.map(serializeDeal)
    const tasks = company.tasks.map(serializeTask)

    // Separar deals por status
    const openDeals = deals.filter((d) => d.status === "OPEN")
    const wonDeals = deals.filter((d) => d.status === "WON")
    const lostDeals = deals.filter((d) => d.status === "LOST")

    // Calcular totais
    const totalOpenValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0)
    const totalWonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0)
    const totalLostValue = lostDeals.reduce((sum, d) => sum + (d.value || 0), 0)

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/companies">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>

                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                {company.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">{company.name}</h1>
                            {company.industry && (
                                <p className="text-muted-foreground">{company.industry}</p>
                            )}
                        </div>
                    </div>
                </div>

                <CompanyActions company={serializeCompanyForActions(company)} />
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Contatos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{company.contacts.length}</div>
                    </CardContent>
                </Card>

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
                            <TrendingUp className="h-4 w-4" />
                            Ganhos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{wonDeals.length}</div>
                        <p className="text-xs text-muted-foreground">{formatCurrency(totalWonValue)}</p>
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
                                <Link href={`/deals?companyId=${company.id}`}>
                                    Ver Pipeline
                                    <ExternalLink className="ml-2 h-3 w-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {deals.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">
                                    Nenhum deal vinculado a esta empresa
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
                                <Link href={`/tasks?companyId=${company.id}`}>
                                    Ver Todas
                                    <ExternalLink className="ml-2 h-3 w-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {tasks.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">
                                    Nenhuma tarefa vinculada a esta empresa
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
                                                                    {task.contact && (
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {task.contact.firstName} {task.contact.lastName}
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
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Informações */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Informações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {company.website && (
                                <a
                                    href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-primary hover:underline"
                                >
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    {company.website}
                                </a>
                            )}

                            {company.email && (
                                <a
                                    href={`mailto:${company.email}`}
                                    className="flex items-center gap-3 hover:text-primary"
                                >
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    {company.email}
                                </a>
                            )}

                            {company.phone && (
                                <a
                                    href={`tel:${company.phone}`}
                                    className="flex items-center gap-3 hover:text-primary"
                                >
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {company.phone}
                                </a>
                            )}

                            {(company.address || company.city) && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        {company.address && <p>{company.address}</p>}
                                        {(company.city || company.state) && (
                                            <p className="text-muted-foreground">
                                                {[company.city, company.state].filter(Boolean).join(", ")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {company.size && (
                                <div className="flex items-center gap-3">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{company.size} funcionários</span>
                                </div>
                            )}

                            {company.description && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                                        <p className="text-sm">{company.description}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contatos */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Contatos
                            </CardTitle>
                            <Badge variant="secondary">{company.contacts.length}</Badge>
                        </CardHeader>
                        <CardContent>
                            {company.contacts.length === 0 ? (
                                <p className="text-muted-foreground text-center py-2">
                                    Nenhum contato vinculado
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {company.contacts.map((contact) => (
                                        <Link
                                            key={contact.id}
                                            href={`/contacts/${contact.id}`}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="text-xs">
                                                    {contact.firstName[0]}
                                                    {contact.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">
                                                    {contact.firstName} {contact.lastName}
                                                </p>
                                                {contact.position && (
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {contact.position}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge className={statusColors[contact.status]} variant="secondary">
                                                {contact.status}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}