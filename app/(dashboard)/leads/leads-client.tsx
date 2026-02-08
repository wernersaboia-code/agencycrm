// app/(dashboard)/leads/leads-client.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Mail,
    Phone,
    Building2,
    Filter,
    X,
    Users,
    UserPlus,
    UserCheck,
    Star,
} from "lucide-react"
import { toast } from "sonner"
import { LeadStatus } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { LeadModal } from "@/components/leads/lead-modal"
import { LeadStatusBadge } from "@/components/leads/lead-status-badge"
import { useWorkspace } from "@/contexts/workspace-context"
import { getLeads, getLeadStats, deleteLead } from "@/actions/leads"

type Lead = {
    id: string
    firstName: string
    lastName: string | null
    email: string
    phone: string | null
    mobile: string | null
    company: string | null
    jobTitle: string | null
    website: string | null
    status: LeadStatus
    source: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
    tags: Array<{ id: string; name: string; color: string }>
    _count: {
        emailSends: number
        calls: number
    }
}

type Stats = {
    total: number
    new: number
    contacted: number
    interested: number
    converted: number
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: "all", label: "Todos os status" },
    { value: "NEW", label: "Novo" },
    { value: "CONTACTED", label: "Contatado" },
    { value: "OPENED", label: "Abriu Email" },
    { value: "CLICKED", label: "Clicou" },
    { value: "REPLIED", label: "Respondeu" },
    { value: "CALLED", label: "Ligação" },
    { value: "INTERESTED", label: "Interessado" },
    { value: "NOT_INTERESTED", label: "Sem Interesse" },
    { value: "NEGOTIATING", label: "Negociando" },
    { value: "CONVERTED", label: "Convertido" },
    { value: "UNSUBSCRIBED", label: "Descadastrado" },
    { value: "BOUNCED", label: "Email Inválido" },
]

export function LeadsClient() {
    const router = useRouter()
    const { activeWorkspace } = useWorkspace()

    const [leads, setLeads] = useState<Lead[]>([])
    const [stats, setStats] = useState<Stats>({
        total: 0,
        new: 0,
        contacted: 0,
        interested: 0,
        converted: 0,
    })
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingLead, setEditingLead] = useState<Lead | null>(null)
    const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Carregar leads
    const loadLeads = useCallback(async () => {
        if (!activeWorkspace) return

        setIsLoading(true)
        try {
            const [leadsResult, statsResult] = await Promise.all([
                getLeads(activeWorkspace.id, {
                    search: search || undefined,
                    status: statusFilter !== "all" ? (statusFilter as LeadStatus) : undefined,
                }),
                getLeadStats(activeWorkspace.id),
            ])

            if (leadsResult.success) {
                setLeads(leadsResult.data || [])
            }

            if (statsResult.success && statsResult.data) {
                setStats(statsResult.data)
            }
        } catch (error) {
            console.error("Erro ao carregar leads:", error)
            toast.error("Erro ao carregar leads")
        } finally {
            setIsLoading(false)
        }
    }, [activeWorkspace, search, statusFilter])

    // Recarregar quando workspace, busca ou filtro mudar
    useEffect(() => {
        loadLeads()
    }, [loadLeads])

    // Handlers
    const handleEdit = (lead: Lead) => {
        setEditingLead(lead)
        setIsModalOpen(true)
    }

    const handleDelete = async () => {
        if (!deletingLead || !activeWorkspace) return

        setIsDeleting(true)
        try {
            const result = await deleteLead(activeWorkspace.id, deletingLead.id)

            if (result.success) {
                toast.success("Lead excluído!")
                setLeads((prev) => prev.filter((l) => l.id !== deletingLead.id))
                loadLeads() // Recarregar stats
            } else {
                toast.error(result.error || "Erro ao excluir")
            }
        } catch (error) {
            toast.error("Erro ao excluir lead")
        } finally {
            setIsDeleting(false)
            setDeletingLead(null)
        }
    }

    const handleSuccess = () => {
        loadLeads()
    }

    const clearFilters = () => {
        setSearch("")
        setStatusFilter("all")
    }

    // Se não tem workspace selecionado
    if (!activeWorkspace) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Nenhum cliente selecionado</h3>
                    <p className="text-muted-foreground text-center mb-4">
                        Selecione um cliente no menu superior para ver os leads.
                    </p>
                    <Button onClick={() => router.push("/workspaces")}>
                        Gerenciar Clientes
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            {/* Cards de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Novos</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.new}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Interessados</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.interested}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.converted}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros e Ações */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-1 gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar leads..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {(search || statusFilter !== "all") && (
                        <Button variant="ghost" size="icon" onClick={clearFilters}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <Button
                    onClick={() => {
                        setEditingLead(null)
                        setIsModalOpen(true)
                    }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Lead
                </Button>
            </div>

            {/* Tabela de Leads */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Users className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">
                                {search || statusFilter !== "all"
                                    ? "Nenhum lead encontrado"
                                    : "Nenhum lead ainda"}
                            </h3>
                            <p className="text-muted-foreground text-center mb-4">
                                {search || statusFilter !== "all"
                                    ? "Tente ajustar os filtros de busca."
                                    : "Comece adicionando seu primeiro lead."}
                            </p>
                            {!search && statusFilter === "all" && (
                                <Button onClick={() => setIsModalOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Lead
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Empresa</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Emails</TableHead>
                                    <TableHead className="text-center">Ligações</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">
                                                    {lead.firstName} {lead.lastName}
                                                </p>
                                                {lead.jobTitle && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {lead.jobTitle}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{lead.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {lead.company ? (
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span>{lead.company}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <LeadStatusBadge status={lead.status} />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {lead._count.emailSends}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {lead._count.calls}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => router.push(`/leads/${lead.id}`)}
                                                    >
                                                        <Users className="h-4 w-4 mr-2" />
                                                        Ver Detalhes
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEdit(lead)}>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeletingLead(lead)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Criar/Editar */}
            <LeadModal
                open={isModalOpen}
                onOpenChange={(open) => {
                    setIsModalOpen(open)
                    if (!open) setEditingLead(null)
                }}
                lead={editingLead}
                onSuccess={handleSuccess}
            />

            {/* Dialog de Confirmação de Exclusão */}
            <AlertDialog
                open={!!deletingLead}
                onOpenChange={(open) => !open && setDeletingLead(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir{" "}
                            <strong>
                                {deletingLead?.firstName} {deletingLead?.lastName}
                            </strong>
                            ?
                            <br />
                            <br />
                            Esta ação irá excluir permanentemente o lead e todo seu histórico
                            de emails e ligações.
                            <br />
                            <br />
                            <strong className="text-destructive">
                                Esta ação não pode ser desfeita.
                            </strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}