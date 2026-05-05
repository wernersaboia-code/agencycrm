// app/(crm)/templates/templates-client.tsx

"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    CopyCheck,
    Plus,
    Search,
    Mail,
    Filter,
    LayoutGrid,
    List,
    FileText,
    X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TemplateCard } from "@/components/templates/template-card"
import { TemplateModal } from "@/components/templates/template-modal"
import { EmptyState } from "@/components/common/empty-state"
import {
    deleteTemplate,
    duplicateTemplate,
    toggleTemplateActive,
    type TemplateWithStats
} from "@/actions/templates"
import { TEMPLATE_CATEGORY_CONFIG } from "@/lib/constants/template.constants"

// ============================================================
// TIPOS
// ============================================================

interface TemplatesClientProps {
    templates: TemplateWithStats[]
    workspaceId: string
}

// ============================================================
// COMPONENTE
// ============================================================

export function TemplatesClient({ templates, workspaceId }: TemplatesClientProps) {
    const router = useRouter()

    // Estado
    const [search, setSearch] = useState("")
    const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [modalOpen, setModalOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<TemplateWithStats | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    // Filtrar templates
    const filteredTemplates = useMemo(() => {
        return templates.filter((template) => {
            // Filtro de busca
            if (search) {
                const searchLower = search.toLowerCase()
                const matchesSearch =
                    template.name.toLowerCase().includes(searchLower) ||
                    template.subject.toLowerCase().includes(searchLower)
                if (!matchesSearch) return false
            }

            // Filtro de categoria
            if (categoryFilter !== "ALL" && template.category !== categoryFilter) {
                return false
            }

            if (statusFilter === "ACTIVE" && !template.isActive) {
                return false
            }

            if (statusFilter === "INACTIVE" && template.isActive) {
                return false
            }

            return true
        })
    }, [templates, search, categoryFilter, statusFilter])

    // Estatísticas
    const stats = useMemo(() => {
        const inCampaigns = templates.filter((t) => t._count.campaigns > 0).length

        return {
            total: templates.length,
            active: templates.filter((t) => t.isActive).length,
            inactive: templates.filter((t) => !t.isActive).length,
            inCampaigns,
            unused: templates.length - inCampaigns,
        }
    }, [templates])

    // Handlers
    const handleCreate = () => {
        setEditingTemplate(null)
        setModalOpen(true)
    }

    const handleEdit = (template: TemplateWithStats) => {
        setEditingTemplate(template)
        setModalOpen(true)
    }

    const handleDuplicate = async (template: TemplateWithStats) => {
        const result = await duplicateTemplate(template.id)

        if (result.success) {
            toast.success("Template duplicado com sucesso!")
            router.refresh()
        } else {
            toast.error(result.error || "Erro ao duplicar template")
        }
    }

    const handleToggleActive = async (template: TemplateWithStats) => {
        const result = await toggleTemplateActive(template.id)

        if (result.success) {
            toast.success(
                template.isActive
                    ? "Template desativado"
                    : "Template ativado"
            )
            router.refresh()
        } else {
            toast.error(result.error || "Erro ao alterar status")
        }
    }

    const handleDelete = async (template: TemplateWithStats) => {
        if (!confirm(`Excluir template ${template.name}?`)) return

        setIsDeleting(template.id)
        const result = await deleteTemplate(template.id)
        setIsDeleting(null)

        if (result.success) {
            toast.success("Template excluído!")
            router.refresh()
        } else {
            toast.error(result.error || "Erro ao excluir template")
        }
    }

    const handleModalClose = () => {
        setModalOpen(false)
        setEditingTemplate(null)
    }

    const handleModalSuccess = () => {
        handleModalClose()
        router.refresh()
    }

    const readinessItems = [
        {
            label: "Template ativo",
            description: stats.active > 0
                ? `${stats.active} pronto${stats.active !== 1 ? "s" : ""} para campanhas.`
                : "Crie ou ative ao menos um template.",
            done: stats.active > 0,
            action: "Criar template",
            onClick: handleCreate,
        },
        {
            label: "Uso em campanhas",
            description: stats.inCampaigns > 0
                ? `${stats.inCampaigns} template${stats.inCampaigns !== 1 ? "s" : ""} já conectado${stats.inCampaigns !== 1 ? "s" : ""}.`
                : "Use um template em uma campanha para iniciar envios.",
            done: stats.inCampaigns > 0,
            action: "Ver campanhas",
            onClick: () => router.push("/campaigns"),
        },
        {
            label: "Templates inativos",
            description: stats.inactive === 0
                ? "Nenhum template parado agora."
                : `${stats.inactive} aguardando ativação ou revisão.`,
            done: stats.total > 0 && stats.inactive === 0,
            action: stats.inactive > 0 ? "Ver inativos" : "Revisar ativos",
            onClick: () => setStatusFilter(stats.inactive > 0 ? "INACTIVE" : "ACTIVE"),
        },
    ]
    const completedReadinessItems = readinessItems.filter((item) => item.done).length
    const readinessProgress = Math.round((completedReadinessItems / readinessItems.length) * 100)

    const clearFilters = () => {
        setSearch("")
        setCategoryFilter("ALL")
        setStatusFilter("ALL")
    }

    const hasActiveFilters = search !== "" || categoryFilter !== "ALL" || statusFilter !== "ALL"

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Mail className="h-6 w-6" />
                        Templates de Email
                    </h1>
                    <p className="text-muted-foreground">
                        {stats.total} template{stats.total !== 1 ? "s" : ""} • {stats.active} ativo{stats.active !== 1 ? "s" : ""}
                    </p>
                </div>

                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Template
                </Button>
            </div>

            <Card className={stats.active > 0 ? "border-emerald-300 dark:border-emerald-900" : "border-amber-300 dark:border-amber-900"}>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <CardTitle>Prontidão da biblioteca</CardTitle>
                            <Badge variant={stats.active > 0 ? "default" : "outline"}>
                                {completedReadinessItems}/{readinessItems.length} completo
                            </Badge>
                        </div>
                        <CardDescription>
                            Templates ativos e conectados reduzem atrito na criação de campanhas.
                        </CardDescription>
                    </div>
                    <div className="w-full space-y-2 lg:w-64">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">{readinessProgress}%</span>
                        </div>
                        <Progress value={readinessProgress} />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                    {readinessItems.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={item.onClick}
                            className="flex min-h-[108px] items-start justify-between gap-3 rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted/50"
                        >
                            <span className="flex min-w-0 gap-3">
                                {item.done ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                ) : (
                                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                )}
                                <span className="space-y-1">
                                    <span className="block font-medium leading-tight">{item.label}</span>
                                    <span className="block text-sm text-muted-foreground">{item.description}</span>
                                    <span className="block text-sm font-medium text-primary">{item.action}</span>
                                </span>
                            </span>
                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                    ))}
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Ativos</p>
                    <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Em campanhas</p>
                    <p className="text-2xl font-bold">{stats.inCampaigns}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Sem uso</p>
                    <p className="text-2xl font-bold">{stats.unused}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar templates..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todas categorias</SelectItem>
                        {Object.entries(TEMPLATE_CATEGORY_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                                {config.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                        <CopyCheck className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos status</SelectItem>
                        <SelectItem value="ACTIVE">Ativos</SelectItem>
                        <SelectItem value="INACTIVE">Inativos</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex border rounded-md">
                    <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("grid")}
                        className="rounded-r-none"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("list")}
                        className="rounded-l-none"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Lista de Templates */}
            {filteredTemplates.length === 0 ? (
                <EmptyState
                    icon={templates.length === 0 ? FileText : Search}
                    title={templates.length === 0 ? "Nenhum template criado" : "Nenhum template encontrado"}
                    description={
                        templates.length === 0
                            ? "Crie modelos reutilizáveis para acelerar campanhas e manter mensagens consistentes."
                            : "Ajuste a busca, categoria ou status para encontrar templates neste cliente."
                    }
                    primaryAction={
                        templates.length === 0
                            ? {
                                label: "Criar template",
                                icon: Plus,
                                onClick: handleCreate,
                            }
                            : hasActiveFilters
                                ? {
                                    label: "Limpar filtros",
                                    icon: X,
                                    variant: "outline",
                                    onClick: clearFilters,
                                }
                                : undefined
                    }
                    secondaryAction={
                        templates.length === 0
                            ? {
                                label: "Ver campanhas",
                                variant: "outline",
                                onClick: () => router.push("/campaigns"),
                            }
                            : undefined
                    }
                />
            ) : (
                <div
                    className={
                        viewMode === "grid"
                            ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                            : "space-y-3"
                    }
                >
                    {filteredTemplates.map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            viewMode={viewMode}
                            isDeleting={isDeleting === template.id}
                            onEdit={() => handleEdit(template)}
                            onDuplicate={() => handleDuplicate(template)}
                            onToggleActive={() => handleToggleActive(template)}
                            onDelete={() => handleDelete(template)}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            <TemplateModal
                open={modalOpen}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                template={editingTemplate}
                workspaceId={workspaceId}
            />
        </>
    )
}
