// app/(crm)/templates/templates-client.tsx

"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
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

            return true
        })
    }, [templates, search, categoryFilter])

    // Estatísticas
    const stats = useMemo(() => {
        return {
            total: templates.length,
            active: templates.filter((t) => t.isActive).length,
            inactive: templates.filter((t) => !t.isActive).length,
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

    const hasActiveFilters = search !== "" || categoryFilter !== "ALL"

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
                            : "Ajuste a busca ou a categoria para encontrar templates neste cliente."
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
                                    onClick: () => {
                                        setSearch("")
                                        setCategoryFilter("ALL")
                                    },
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
