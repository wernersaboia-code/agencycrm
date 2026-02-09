// components/campaigns/campaign-wizard.tsx

"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import {
    ChevronLeft,
    ChevronRight,
    Check,
    Loader2,
    Mail,
    Users,
    Send,
    Search,
    FileText,
    AlertCircle,
} from "lucide-react"
import { LeadStatus } from "@prisma/client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"

import { createCampaign, getLeadsForCampaign } from "@/actions/campaigns"
import type { TemplateWithStats } from "@/actions/templates"
import { getCategoryConfig } from "@/lib/constants/template.constants"
import { LEAD_STATUS_CONFIG } from "@/lib/constants/lead.constants"
import { replaceVariables, PREVIEW_LEAD } from "@/lib/constants/template.constants"
import { cn } from "@/lib/utils"

// ============================================================
// TIPOS
// ============================================================

interface CampaignWizardProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    templates: TemplateWithStats[]
    workspaceId: string
}

interface LeadForSelection {
    id: string
    firstName: string
    lastName: string | null
    email: string
    company: string | null
    status: LeadStatus
}

interface WizardData {
    // Passo 1
    name: string
    description: string
    templateId: string
    // Passo 2
    selectedLeadIds: string[]
    // Passo 3
    sendNow: boolean
    scheduledAt: string
}

const INITIAL_DATA: WizardData = {
    name: "",
    description: "",
    templateId: "",
    selectedLeadIds: [],
    sendNow: true,
    scheduledAt: "",
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function CampaignWizard({
                                   open,
                                   onClose,
                                   onSuccess,
                                   templates,
                                   workspaceId,
                               }: CampaignWizardProps) {
    // Estado
    const [step, setStep] = useState(1)
    const [data, setData] = useState<WizardData>(INITIAL_DATA)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Estado do passo 2 (leads)
    const [leads, setLeads] = useState<LeadForSelection[]>([])
    const [isLoadingLeads, setIsLoadingLeads] = useState(false)
    const [leadSearch, setLeadSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("ALL")

    // Reset quando fecha/abre
    useEffect(() => {
        if (open) {
            setStep(1)
            setData(INITIAL_DATA)
            setLeads([])
            setLeadSearch("")
            setStatusFilter("ALL")
        }
    }, [open])

    // Carregar leads quando chegar no passo 2
    useEffect(() => {
        if (step === 2 && leads.length === 0) {
            loadLeads()
        }
    }, [step])

    // ============================================================
    // FUNÇÕES
    // ============================================================

    const loadLeads = async () => {
        setIsLoadingLeads(true)
        const result = await getLeadsForCampaign(workspaceId)
        setIsLoadingLeads(false)

        if (result.success && result.data) {
            setLeads(result.data)
        } else {
            toast.error("Erro ao carregar leads")
        }
    }

    const selectedTemplate = useMemo(() => {
        return templates.find((t) => t.id === data.templateId)
    }, [templates, data.templateId])

    const filteredLeads = useMemo(() => {
        return leads.filter((lead) => {
            // Filtro de busca
            if (leadSearch) {
                const search = leadSearch.toLowerCase()
                const matchesSearch =
                    lead.firstName.toLowerCase().includes(search) ||
                    lead.lastName?.toLowerCase().includes(search) ||
                    lead.email.toLowerCase().includes(search) ||
                    lead.company?.toLowerCase().includes(search)
                if (!matchesSearch) return false
            }

            // Filtro de status
            if (statusFilter !== "ALL" && lead.status !== statusFilter) {
                return false
            }

            return true
        })
    }, [leads, leadSearch, statusFilter])

    const selectedLeads = useMemo(() => {
        return leads.filter((lead) => data.selectedLeadIds.includes(lead.id))
    }, [leads, data.selectedLeadIds])

    // ============================================================
    // VALIDAÇÕES
    // ============================================================

    const validateStep1 = (): boolean => {
        if (!data.name.trim()) {
            toast.error("Digite o nome da campanha")
            return false
        }
        if (!data.templateId) {
            toast.error("Selecione um template")
            return false
        }
        return true
    }

    const validateStep2 = (): boolean => {
        if (data.selectedLeadIds.length === 0) {
            toast.error("Selecione pelo menos um lead")
            return false
        }
        return true
    }

    // ============================================================
    // NAVEGAÇÃO
    // ============================================================

    const handleNext = () => {
        if (step === 1 && !validateStep1()) return
        if (step === 2 && !validateStep2()) return
        setStep((s) => Math.min(s + 1, 3))
    }

    const handleBack = () => {
        setStep((s) => Math.max(s - 1, 1))
    }

    // ============================================================
    // SUBMIT
    // ============================================================

    const handleSubmit = async () => {
        setIsSubmitting(true)

        try {
            const result = await createCampaign({
                name: data.name,
                description: data.description || null,
                templateId: data.templateId,
                selectedLeadIds: data.selectedLeadIds,
                scheduledAt: data.sendNow ? null : data.scheduledAt || null,
                workspaceId,
            })

            if (result.success) {
                toast.success("Campanha criada com sucesso!")
                onSuccess()
            } else {
                toast.error(result.error || "Erro ao criar campanha")
            }
        } catch (error) {
            toast.error("Erro inesperado")
        } finally {
            setIsSubmitting(false)
        }
    }

    // ============================================================
    // HANDLERS DE SELEÇÃO
    // ============================================================

    const toggleLead = (leadId: string) => {
        setData((prev) => ({
            ...prev,
            selectedLeadIds: prev.selectedLeadIds.includes(leadId)
                ? prev.selectedLeadIds.filter((id) => id !== leadId)
                : [...prev.selectedLeadIds, leadId],
        }))
    }

    const selectAllFiltered = () => {
        const filteredIds = filteredLeads.map((l) => l.id)
        setData((prev) => ({
            ...prev,
            selectedLeadIds: [...new Set([...prev.selectedLeadIds, ...filteredIds])],
        }))
    }

    const deselectAllFiltered = () => {
        const filteredIds = new Set(filteredLeads.map((l) => l.id))
        setData((prev) => ({
            ...prev,
            selectedLeadIds: prev.selectedLeadIds.filter((id) => !filteredIds.has(id)),
        }))
    }

    const clearSelection = () => {
        setData((prev) => ({ ...prev, selectedLeadIds: [] }))
    }

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Nova Campanha</DialogTitle>
                    <DialogDescription>
                        Crie uma nova campanha de email em 3 passos simples.
                    </DialogDescription>
                </DialogHeader>

                {/* Indicador de Passos */}
                <div className="flex items-center justify-center gap-2 py-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                    step === s
                                        ? "bg-primary text-primary-foreground"
                                        : step > s
                                            ? "bg-green-500 text-white"
                                            : "bg-muted text-muted-foreground"
                                )}
                            >
                                {step > s ? <Check className="h-4 w-4" /> : s}
                            </div>
                            {s < 3 && (
                                <div
                                    className={cn(
                                        "w-16 h-1 mx-2 rounded",
                                        step > s ? "bg-green-500" : "bg-muted"
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="text-center text-sm text-muted-foreground mb-4">
                    {step === 1 && "Informações e Template"}
                    {step === 2 && "Selecionar Destinatários"}
                    {step === 3 && "Revisar e Enviar"}
                </div>

                <Separator />

                {/* Conteúdo dos Passos */}
                <div className="flex-1 overflow-hidden py-4">
                    {/* ====== PASSO 1: INFORMAÇÕES + TEMPLATE ====== */}
                    {step === 1 && (
                        <ScrollArea className="h-[calc(90vh-350px)]">
                            <div className="space-y-6 pr-4">
                                {/* Nome e Descrição */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome da Campanha *</Label>
                                        <Input
                                            id="name"
                                            placeholder="Ex: Prospecção Janeiro 2025"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData((prev) => ({ ...prev, name: e.target.value }))
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Descrição (opcional)</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Descreva o objetivo da campanha..."
                                            value={data.description}
                                            onChange={(e) =>
                                                setData((prev) => ({ ...prev, description: e.target.value }))
                                            }
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Seleção de Template */}
                                <div className="space-y-4">
                                    <Label>Selecione o Template *</Label>

                                    {templates.length === 0 ? (
                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Nenhum template disponível</AlertTitle>
                                            <AlertDescription>
                                                Você precisa criar pelo menos um template antes de criar uma campanha.
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {templates
                                                .filter((t) => t.isActive)
                                                .map((template) => {
                                                    const categoryConfig = getCategoryConfig(template.category)
                                                    const isSelected = data.templateId === template.id

                                                    return (
                                                        <Card
                                                            key={template.id}
                                                            className={cn(
                                                                "cursor-pointer transition-all hover:shadow-md",
                                                                isSelected && "ring-2 ring-primary"
                                                            )}
                                                            onClick={() =>
                                                                setData((prev) => ({ ...prev, templateId: template.id }))
                                                            }
                                                        >
                                                            <CardHeader className="pb-2">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <div
                                                                            className={cn(
                                                                                "p-1.5 rounded",
                                                                                categoryConfig.bgColor
                                                                            )}
                                                                        >
                                                                            <categoryConfig.icon
                                                                                className={cn("h-4 w-4", categoryConfig.color)}
                                                                            />
                                                                        </div>
                                                                        <CardTitle className="text-base">
                                                                            {template.name}
                                                                        </CardTitle>
                                                                    </div>
                                                                    {isSelected && (
                                                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                                            <Check className="h-3 w-3 text-primary-foreground" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <Badge variant="outline" className="w-fit text-xs">
                                                                    {categoryConfig.label}
                                                                </Badge>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                                    {template.subject}
                                                                </p>
                                                            </CardContent>
                                                        </Card>
                                                    )
                                                })}
                                        </div>
                                    )}
                                </div>

                                {/* Preview do Template Selecionado */}
                                {selectedTemplate && (
                                    <>
                                        <Separator />
                                        <div className="space-y-3">
                                            <Label>Preview do Email</Label>
                                            <Card className="bg-muted/30">
                                                <CardHeader className="pb-2">
                                                    <CardDescription>
                                                        <strong>Assunto:</strong>{" "}
                                                        {replaceVariables(selectedTemplate.subject, PREVIEW_LEAD)}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div
                                                        className="prose prose-sm dark:prose-invert max-w-none"
                                                        dangerouslySetInnerHTML={{
                                                            __html: replaceVariables(selectedTemplate.body, PREVIEW_LEAD),
                                                        }}
                                                    />
                                                </CardContent>
                                            </Card>
                                            <p className="text-xs text-muted-foreground">
                                                * Preview usando dados de exemplo. As variáveis serão substituídas pelos dados reais.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    )}

                    {/* ====== PASSO 2: SELECIONAR LEADS ====== */}
                    {step === 2 && (
                        <div className="h-[calc(90vh-350px)] flex flex-col">
                            {/* Filtros e contadores */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar leads..."
                                        value={leadSearch}
                                        onChange={(e) => setLeadSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos os status</SelectItem>
                                        {Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                {config.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Ações de seleção */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-muted-foreground">
                                    {filteredLeads.length} leads encontrados •{" "}
                                    <span className="font-medium text-foreground">
                    {data.selectedLeadIds.length} selecionados
                  </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={selectAllFiltered}
                                    >
                                        Selecionar todos
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={deselectAllFiltered}
                                    >
                                        Desmarcar filtrados
                                    </Button>
                                    {data.selectedLeadIds.length > 0 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearSelection}
                                        >
                                            Limpar seleção
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Lista de Leads - CORRIGIDO O SCROLL */}
                            <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
                                <ScrollArea className="h-full">
                                    {isLoadingLeads ? (
                                        <div className="flex items-center justify-center h-48">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : filteredLeads.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                            <Users className="h-8 w-8 mb-2" />
                                            <p>Nenhum lead encontrado</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {filteredLeads.map((lead) => {
                                                const isSelected = data.selectedLeadIds.includes(lead.id)
                                                const statusConfig = LEAD_STATUS_CONFIG[lead.status]

                                                return (
                                                    <div
                                                        key={lead.id}
                                                        className={cn(
                                                            "flex items-center gap-4 p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                                                            isSelected && "bg-primary/5"
                                                        )}
                                                        onClick={() => toggleLead(lead.id)}
                                                    >
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleLead(lead.id)}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {lead.firstName} {lead.lastName}
                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs shrink-0"
                                                                    style={{
                                                                        borderColor: statusConfig?.color,
                                                                        color: statusConfig?.color,
                                                                    }}
                                                                >
                                                                    {statusConfig?.label || lead.status}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                                <span className="truncate">{lead.email}</span>
                                                                {lead.company && (
                                                                    <span className="truncate">• {lead.company}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    )}

                    {/* ====== PASSO 3: REVISAR E ENVIAR ====== */}
                    {step === 3 && (
                        <ScrollArea className="h-[calc(90vh-350px)]">
                            <div className="space-y-6 pr-4">
                                {/* Resumo */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Resumo da Campanha
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <Label className="text-muted-foreground">Nome</Label>
                                                <p className="font-medium">{data.name}</p>
                                            </div>
                                            {data.description && (
                                                <div>
                                                    <Label className="text-muted-foreground">Descrição</Label>
                                                    <p className="font-medium">{data.description}</p>
                                                </div>
                                            )}
                                            <div>
                                                <Label className="text-muted-foreground">Template</Label>
                                                <p className="font-medium">{selectedTemplate?.name}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Destinatários</Label>
                                                <p className="font-medium">
                                                    {data.selectedLeadIds.length} lead(s)
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Lista de destinatários */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Destinatários ({selectedLeads.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                            {selectedLeads.slice(0, 20).map((lead) => (
                                                <Badge key={lead.id} variant="secondary">
                                                    {lead.firstName} {lead.lastName} ({lead.email})
                                                </Badge>
                                            ))}
                                            {selectedLeads.length > 20 && (
                                                <Badge variant="outline">
                                                    +{selectedLeads.length - 20} mais
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Preview do email */}
                                {selectedTemplate && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Mail className="h-5 w-5" />
                                                Preview do Email
                                            </CardTitle>
                                            <CardDescription>
                                                Assunto: {replaceVariables(selectedTemplate.subject, PREVIEW_LEAD)}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div
                                                className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/30 rounded-lg"
                                                dangerouslySetInnerHTML={{
                                                    __html: replaceVariables(selectedTemplate.body, PREVIEW_LEAD),
                                                }}
                                            />
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Aviso */}
                                <Alert>
                                    <Send className="h-4 w-4" />
                                    <AlertTitle>Pronto para enviar!</AlertTitle>
                                    <AlertDescription>
                                        Ao clicar em "Criar Campanha", ela será salva como rascunho.
                                        Você poderá enviá-la depois clicando no botão "Enviar".
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <Separator />

                {/* Footer com navegação */}
                <div className="flex justify-between pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={step === 1 ? onClose : handleBack}
                        disabled={isSubmitting}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        {step === 1 ? "Cancelar" : "Voltar"}
                    </Button>

                    {step < 3 ? (
                        <Button type="button" onClick={handleNext}>
                            Próximo
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4 mr-2" />
                            )}
                            Criar Campanha
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}