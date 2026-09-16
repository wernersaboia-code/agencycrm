// app/(crm)/leads/leads-client.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Building2,
    Filter,
    SlidersHorizontal,
    X,
    Users,
    UserPlus,
    UserCheck,
    Star,
    Upload,
    ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { LeadStatus, LeadSource, CompanySize } from "@prisma/client"

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
    SelectGroup,
    SelectItem,
    SelectLabel,
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
import {
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import { EmptyState } from "@/components/common/empty-state"
import { LeadModal } from "@/components/leads/lead-modal"
import { LeadStatusBadge } from "@/components/leads/lead-status-badge"
import { ClickToCallButton } from "@/components/calls/ClickToCallButton"
import { useWorkspace } from "@/contexts/workspace-context"
import { getLeads, deleteLead } from "@/actions/leads"
import {
    LEAD_STATUS_OPTIONS,
    COUNTRIES,
    INDUSTRIES,
} from "@/lib/constants/lead.constants"
import { formatFullName, getCompanySizeLabel } from "@/lib/utils/lead.utils"
import { ExportLeadsButtons } from "@/components/reports/export-leads-buttons"

// ============================================================
// TIPOS
// ============================================================

interface Lead {
    id: string
    firstName: string
    lastName: string | null
    email: string
    phone: string | null
    mobile: string | null
    company: string | null
    jobTitle: string | null
    website: string | null
    taxId: string | null
    industry: string | null
    companySize: CompanySize | null
    address: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    country: string | null
    status: LeadStatus
    source: LeadSource
    notes: string | null
    assignedToId: string | null
    assignedTo?: {
        id: string
        name: string | null
        email: string
    } | null
    createdAt: Date | string
    updatedAt: Date | string
    _count?: {
        emailSends: number
        calls: number
    }
}

interface LeadStats {
    total: number
    new: number
    interested: number
    converted: number
}

interface Filters {
    search: string
    status: string
    country: string
    industry: string
}

// ============================================================
// CONSTANTES
// ============================================================

const INITIAL_FILTERS: Filters = {
    search: "",
    status: "all",
    country: "all",
    industry: "all",
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function StatsCard({
                       title,
                       value,
                       icon: Icon,
                       isLoading = false,
                   }: {
    title: string
    value: number
    icon: React.ElementType
    isLoading?: boolean
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                ) : (
                    <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                )}
            </CardContent>
        </Card>
    )
}

function LoadingTable() {
    return (
        <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                </div>
            ))}
        </div>
    )
}

function LeadRow({
                     lead,
                     onEdit,
                     onDelete,
                     onRowClick,
                 }: {
    lead: Lead
    onEdit: (lead: Lead) => void
    onDelete: (lead: Lead) => void
    onRowClick: (lead: Lead) => void
}) {
    const fullName = formatFullName(lead.firstName, lead.lastName)
    const companySizeLabel = getCompanySizeLabel(lead.companySize)

    // Dados do lead para o Click-to-Call
    const leadForCall = {
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
    }

    // Handler para clique na linha (evita propagação dos botões)
    const handleRowClick = (e: React.MouseEvent) => {
        // Ignora clique se foi em um botão ou dropdown
        const target = e.target as HTMLElement
        if (
            target.closest('button') ||
            target.closest('[role="menuitem"]') ||
            target.closest('[data-radix-collection-item]')
        ) {
            return
        }
        onRowClick(lead)
    }

    return (
        <TableRow
            className="group cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={handleRowClick}
        >
            {/* Nome e Cargo */}
            <TableCell>
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                            {lead.firstName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <p className="font-medium flex items-center gap-2">
                            {fullName}
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                        {lead.jobTitle && (
                            <p className="text-sm text-muted-foreground">{lead.jobTitle}</p>
                        )}
                    </div>
                </div>
            </TableCell>

            {/* Empresa */}
            <TableCell>
                {lead.company ? (
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                            <span className="text-sm">{lead.company}</span>
                            {companySizeLabel && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                    {companySizeLabel}
                                </Badge>
                            )}
                        </div>
                    </div>
                ) : (
                    <span className="text-muted-foreground">—</span>
                )}
            </TableCell>

            {/* Status */}
            <TableCell>
                <LeadStatusBadge status={lead.status} />
            </TableCell>

            {/* Responsável */}
            <TableCell>
                {lead.assignedTo ? (
                    <div className="min-w-[120px]">
                        <p className="text-sm font-medium">{lead.assignedTo.name || lead.assignedTo.email}</p>
                        {lead.assignedTo.name && (
                            <p className="max-w-[150px] truncate text-xs text-muted-foreground">{lead.assignedTo.email}</p>
                        )}
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">Sem responsável</span>
                )}
            </TableCell>

            {/* Ações principais */}
            <TableCell>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="min-h-9" onClick={() => onRowClick(lead)}>
                        Abrir ficha
                    </Button>
                    {lead.phone && (
                        <ClickToCallButton
                            lead={leadForCall}
                            variant="outline"
                            size="sm"
                            showLabel={true}
                        />
                    )}

                    {/* Ações menos frequentes */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onRowClick(lead)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Abrir ficha
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(lead)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(lead)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </TableCell>
        </TableRow>
    )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function LeadsClient() {
    const router = useRouter()
    const { activeWorkspace } = useWorkspace()

    // Estado
    const [leads, setLeads] = useState<Lead[]>([])
    const [stats, setStats] = useState<LeadStats>({
        total: 0,
        new: 0,
        interested: 0,
        converted: 0,
    })
    const [isLoading, setIsLoading] = useState(true)
    const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS)
    const [showMoreFilters, setShowMoreFilters] = useState(false)

    // Modais
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingLead, setEditingLead] = useState<Lead | null>(null)
    const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Verificar se tem filtros ativos
    const hasActiveFilters =
        filters.search !== "" ||
        filters.status !== "all" ||
        filters.country !== "all" ||
        filters.industry !== "all"

    // Carregar leads
    const loadLeads = useCallback(async () => {
        if (!activeWorkspace) return

        setIsLoading(true)
        try {
            const result = await getLeads({
                workspaceId: activeWorkspace.id,
                search: filters.search || undefined,
                status: filters.status !== "all" ? (filters.status as LeadStatus) : undefined,
                country: filters.country !== "all" ? filters.country : undefined,
                industry: filters.industry !== "all" ? filters.industry : undefined,
            })

            if (result.success && result.data) {
                setLeads(result.data.leads as unknown as Lead[])
                setStats(result.data.stats)
            } else {
                toast.error(result.error || "Erro ao carregar leads")
            }
        } catch (error) {
            console.error("Erro ao carregar leads:", error)
            toast.error("Erro ao carregar leads")
        } finally {
            setIsLoading(false)
        }
    }, [activeWorkspace, filters])

    // Recarregar quando workspace ou filtros mudam
    useEffect(() => {
        loadLeads()
    }, [loadLeads])

    // Handlers
    const handleFilterChange = (key: keyof Filters, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const handleClearFilters = () => {
        setFilters(INITIAL_FILTERS)
    }

    const handleEdit = (lead: Lead) => {
        setEditingLead(lead)
        setIsModalOpen(true)
    }

    const handleRowClick = (lead: Lead) => {
        router.push(`/leads/${lead.id}`)
    }

    const handleDelete = async () => {
        if (!deletingLead) return

        setIsDeleting(true)
        try {
            const result = await deleteLead(deletingLead.id)

            if (result.success) {
                toast.success("Lead excluído com sucesso!")
                loadLeads()
            } else {
                toast.error(result.error || "Erro ao excluir lead")
            }
        } catch (error) {
            console.error("Erro ao excluir lead:", error)
            toast.error("Erro ao excluir lead")
        } finally {
            setIsDeleting(false)
            setDeletingLead(null)
        }
    }

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open)
        if (!open) {
            setEditingLead(null)
        }
    }

    const handleSuccess = () => {
        loadLeads()
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
                <StatsCard
                    title="Todos os contatos"
                    value={stats.total}
                    icon={Users}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Ainda não contatados"
                    value={stats.new}
                    icon={UserPlus}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Interessados"
                    value={stats.interested}
                    icon={Star}
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Convertidos"
                    value={stats.converted}
                    icon={UserCheck}
                    isLoading={isLoading}
                />
            </div>

            <Card className="border-primary/15 bg-primary/[0.02]">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-semibold">Comece por aqui</p>
                        <p className="text-sm text-muted-foreground">
                            Para trabalhar um contato, clique em <strong>Abrir ficha</strong>. Depois, registre a ligação ou o retorno combinado.
                        </p>
                    </div>
                    <Button className="min-h-11 shrink-0" onClick={() => setIsModalOpen(true)}>
                        <Plus className="mr-2 h-5 w-5" />
                        Adicionar contato
                    </Button>
                </CardContent>
            </Card>

            {/* Busca, filtros e ações */}
            <div className="flex flex-col gap-4">
                {/* Linha 1: Busca e Botões */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Procurar por nome, empresa ou e-mail..."
                            className="h-11 pl-9 text-base"
                            value={filters.search}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button className="min-h-11" variant="outline" onClick={() => router.push('/leads/import')}>
                            <Upload className="h-4 w-4 mr-2" />
                            Importar planilha
                        </Button>
                        <ExportLeadsButtons
                            workspaceId={activeWorkspace.id}
                            filters={{
                                status: filters.status !== "all" ? filters.status : undefined,
                                country: filters.country !== "all" ? filters.country : undefined,
                                industry: filters.industry !== "all" ? filters.industry : undefined,
                                search: filters.search || undefined,
                            }}
                        />
                    </div>
                </div>

                {/* Filtros essenciais */}
                <div className="flex flex-wrap gap-2 items-center">
                    <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />

                    {/* Filtro de Status */}
                    <Select
                        value={filters.status}
                        onValueChange={(value) => handleFilterChange("status", value)}
                    >
                        <SelectTrigger className="h-10 w-[210px]">
                            <SelectValue placeholder="Situação do contato" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as situações</SelectItem>
                            {LEAD_STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        className="h-10"
                        onClick={() => setShowMoreFilters((current) => !current)}
                    >
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        {showMoreFilters ? "Menos filtros" : "Mais filtros"}
                    </Button>

                    {!isLoading && (
                        <Badge variant="secondary" className="ml-auto px-3 py-1 text-sm">
                            {leads.length} {leads.length === 1 ? "contato" : "contatos"}
                        </Badge>
                    )}
                </div>

                {showMoreFilters && (
                    <div className="flex flex-wrap gap-2 items-center rounded-lg border bg-muted/30 p-3">
                        <span className="mr-1 text-sm font-medium text-muted-foreground">Refinar por:</span>
                    {/* Filtro de País */}
                    <Select
                        value={filters.country}
                        onValueChange={(value) => handleFilterChange("country", value)}
                    >
                        <SelectTrigger className="w-[160px] h-9">
                            <SelectValue placeholder="País" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os países</SelectItem>
                            <SelectGroup>
                                <SelectLabel>Mais usados</SelectLabel>
                                {COUNTRIES.slice(0, 4).map((country) => (
                                    <SelectItem key={country.code} value={country.code}>
                                        {country.flag} {country.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel>Europa</SelectLabel>
                                {COUNTRIES.filter((c) => c.region === "Europa").map((country) => (
                                    <SelectItem key={country.code} value={country.code}>
                                        {country.flag} {country.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel>Américas</SelectLabel>
                                {COUNTRIES.filter((c) =>
                                    c.region === "América do Sul" || c.region === "América do Norte"
                                ).map((country) => (
                                    <SelectItem key={country.code} value={country.code}>
                                        {country.flag} {country.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel>Outros</SelectLabel>
                                {COUNTRIES.filter((c) =>
                                    !["Europa", "América do Sul", "América do Norte"].includes(c.region)
                                ).map((country) => (
                                    <SelectItem key={country.code} value={country.code}>
                                        {country.flag} {country.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    {/* Filtro de Segmento */}
                    <Select
                        value={filters.industry}
                        onValueChange={(value) => handleFilterChange("industry", value)}
                    >
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Segmento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os segmentos</SelectItem>
                            {INDUSTRIES.map((industry) => (
                                <SelectItem key={industry} value={industry}>
                                    {industry}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Botão limpar filtros */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            className="h-9"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Limpar
                        </Button>
                    )}
                    </div>
                )}
                </div>

            {/* Tabela de Leads */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <LoadingTable />
                    ) : leads.length === 0 ? (
                        hasActiveFilters ? (
                            <EmptyState
                                icon={Users}
                                title="Nenhum lead encontrado"
                                description="Tente ajustar os filtros de busca."
                                secondaryAction={{
                                    label: "Limpar Filtros",
                                    onClick: handleClearFilters,
                                    icon: X,
                                    variant: "outline",
                                }}
                            />
                        ) : (
                            <EmptyState
                                icon={Users}
                                title="Nenhum lead ainda"
                                description="Comece adicionando seu primeiro lead ou importe de uma planilha."
                                primaryAction={{
                                    label: "Adicionar Lead",
                                    onClick: () => setIsModalOpen(true),
                                    icon: Plus,
                                }}
                                secondaryAction={{
                                    label: "Importar CSV",
                                    onClick: () => router.push('/leads/import'),
                                    icon: Upload,
                                    variant: "outline",
                                }}
                            />
                        )
                    ) : (
                        <div className="relative">
                            {/* Indicador de scroll */}
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 opacity-50" />

                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[200px] sticky left-0 bg-background z-20">Nome</TableHead>
                            <TableHead className="min-w-[150px]">Empresa</TableHead>
                            <TableHead className="min-w-[150px]">Situação</TableHead>
                            <TableHead className="min-w-[150px]">Responsável</TableHead>
                            <TableHead className="min-w-[150px] sticky right-0 bg-background z-20">Abrir</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leads.map((lead) => (
                                            <LeadRow
                                                key={lead.id}
                                                lead={lead}
                                                onEdit={handleEdit}
                                                onDelete={setDeletingLead}
                                                onRowClick={handleRowClick}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Criar/Editar */}
            <LeadModal
                open={isModalOpen}
                onOpenChange={handleModalClose}
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
                                {deletingLead && formatFullName(deletingLead.firstName, deletingLead.lastName)}
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
