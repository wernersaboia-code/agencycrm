// app/(crm)/campaigns/campaigns-client.tsx

"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowRight,
    CheckCircle2,
    Plus,
    Search,
    Send,
    MousePointer,
    Eye,
    AlertTriangle,
    AlertCircle,
    Filter,
    Megaphone,
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/common/empty-state"
import { CampaignCard } from "@/components/campaigns/campaign-card"
import { CampaignWizard } from "@/components/campaigns/campaign-wizard"
import { SendConfirmationDialog } from "@/components/campaigns/send-confirmation-dialog"
import {
    deleteCampaign,
    duplicateCampaign,
    sendCampaign,
    cancelCampaign,
    type CampaignWithRelations,
} from "@/actions/campaigns"
import type { TemplateWithStats } from "@/actions/templates"
import { CAMPAIGN_STATUS_CONFIG } from "@/lib/constants/campaign.constants"

// ============================================================
// TIPOS
// ============================================================

interface CampaignsClientProps {
    campaigns: CampaignWithRelations[]
    templates: TemplateWithStats[]
    workspaceId: string
}

// ============================================================
// COMPONENTE
// ============================================================

export function CampaignsClient({
                                    campaigns,
                                    templates,
                                    workspaceId,
                                }: CampaignsClientProps) {
    const router = useRouter()

    // Estado
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [wizardOpen, setWizardOpen] = useState(false)
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const [sendingCampaign, setSendingCampaign] = useState<CampaignWithRelations | null>(null)

    // Filtrar campanhas
    const filteredCampaigns = useMemo(() => {
        return campaigns.filter((campaign) => {
            if (search) {
                const searchLower = search.toLowerCase()
                const matchesSearch =
                    campaign.name.toLowerCase().includes(searchLower) ||
                    campaign.description?.toLowerCase().includes(searchLower) ||
                    campaign.template?.name.toLowerCase().includes(searchLower)
                if (!matchesSearch) return false
            }

            if (statusFilter !== "ALL" && campaign.status !== statusFilter) {
                return false
            }

            return true
        })
    }, [campaigns, search, statusFilter])

    const globalStats = useMemo(() => {
        const totals = campaigns.reduce(
            (acc, campaign) => ({
                sent: acc.sent + campaign.totalSent,
                opened: acc.opened + campaign.totalOpened,
                clicked: acc.clicked + campaign.totalClicked,
                bounced: acc.bounced + campaign.totalBounced,
            }),
            { sent: 0, opened: 0, clicked: 0, bounced: 0 }
        )

        return {
            total: campaigns.length,
            draft: campaigns.filter((c) => c.status === "DRAFT").length,
            sentCampaigns: campaigns.filter((c) => c.status === "SENT").length,
            totalSent: totals.sent,
            totalOpened: totals.opened,
            totalClicked: totals.clicked,
            totalBounced: totals.bounced,
            openRate: totals.sent > 0 ? (totals.opened / totals.sent) * 100 : 0,
            clickRate: totals.opened > 0 ? (totals.clicked / totals.opened) * 100 : 0,
        }
    }, [campaigns])
    const activeTemplatesCount = templates.filter((template) => template.isActive).length

    // ============================================================
    // HANDLERS
    // ============================================================

    const handleCreate = () => {
        if (activeTemplatesCount === 0) {
            toast.error("Crie ou ative pelo menos um template antes de criar uma campanha")
            router.push("/templates")
            return
        }
        setWizardOpen(true)
    }

    const handleDuplicate = async (campaign: CampaignWithRelations) => {
        setIsLoading(campaign.id)
        const result = await duplicateCampaign(campaign.id)
        setIsLoading(null)

        if (result.success) {
            toast.success("Campanha duplicada!")
            router.refresh()
        } else {
            toast.error(result.error || "Erro ao duplicar")
        }
    }

    const handleSendClick = (campaign: CampaignWithRelations) => {
        setSendingCampaign(campaign)
    }

    const handleConfirmSend = async () => {
        if (!sendingCampaign) return

        setIsLoading(sendingCampaign.id)
        try {
            const result = await sendCampaign(sendingCampaign.id)
            if (result.success) {
                toast.success("Campanha enviada com sucesso!")
                setSendingCampaign(null)
                router.refresh()
            } else {
                toast.error(result.error || "Erro ao enviar")
            }
        } catch {
            toast.error("Erro ao enviar campanha")
        } finally {
            setIsLoading(null)
        }
    }

    const handleCancel = async (campaign: CampaignWithRelations) => {
        if (!confirm(`Cancelar campanha "${campaign.name}"?`)) return

        setIsLoading(campaign.id)
        const result = await cancelCampaign(campaign.id)
        setIsLoading(null)

        if (result.success) {
            toast.success("Campanha cancelada")
            router.refresh()
        } else {
            toast.error(result.error || "Erro ao cancelar")
        }
    }

    const handleDelete = async (campaign: CampaignWithRelations) => {
        if (!confirm(`Excluir campanha "${campaign.name}"? Esta ação não pode ser desfeita.`)) {
            return
        }

        setIsLoading(campaign.id)
        const result = await deleteCampaign(campaign.id)
        setIsLoading(null)

        if (result.success) {
            toast.success("Campanha excluída!")
            router.refresh()
        } else {
            toast.error(result.error || "Erro ao excluir")
        }
    }

    const handleWizardSuccess = () => {
        setWizardOpen(false)
        router.refresh()
    }

    const handleViewDetails = (campaign: CampaignWithRelations): void => {
        router.push(`/campaigns/${campaign.id}`)
    }

    const readinessItems = [
        {
            label: "Template ativo",
            description: activeTemplatesCount > 0
                ? `${activeTemplatesCount} template${activeTemplatesCount !== 1 ? "s" : ""} ativo${activeTemplatesCount !== 1 ? "s" : ""} para campanhas.`
                : "Ative um template para liberar a criação.",
            done: activeTemplatesCount > 0,
            action: activeTemplatesCount > 0 ? "Criar campanha" : "Ir para templates",
            onClick: activeTemplatesCount > 0 ? handleCreate : () => router.push("/templates"),
        },
        {
            label: "Rascunhos",
            description: globalStats.draft > 0
                ? `${globalStats.draft} aguardando revisão ou envio.`
                : "Nenhuma campanha pendente agora.",
            done: globalStats.draft > 0,
            action: globalStats.draft > 0 ? "Ver rascunhos" : "Nova campanha",
            onClick: globalStats.draft > 0 ? () => setStatusFilter("DRAFT") : handleCreate,
        },
        {
            label: "Envios realizados",
            description: globalStats.totalSent > 0
                ? `${globalStats.totalSent.toLocaleString()} email${globalStats.totalSent !== 1 ? "s" : ""} enviados.`
                : "Envie uma campanha para gerar métricas.",
            done: globalStats.totalSent > 0,
            action: globalStats.totalSent > 0 ? "Ver enviadas" : "Preparar envio",
            onClick: globalStats.totalSent > 0 ? () => setStatusFilter("SENT") : handleCreate,
        },
    ]
    const completedReadinessItems = readinessItems.filter((item) => item.done).length
    const readinessProgress = Math.round((completedReadinessItems / readinessItems.length) * 100)

    const hasActiveFilters = search !== "" || statusFilter !== "ALL"

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Megaphone className="h-6 w-6" />
                        Campanhas
                    </h1>
                    <p className="text-muted-foreground">
                        {globalStats.total} campanha{globalStats.total !== 1 ? "s" : ""} •{" "}
                        {globalStats.draft} rascunho{globalStats.draft !== 1 ? "s" : ""} •{" "}
                        {globalStats.sentCampaigns} enviada{globalStats.sentCampaigns !== 1 ? "s" : ""}
                    </p>
                </div>

                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Campanha
                </Button>
            </div>

            <Card className={activeTemplatesCount > 0 ? "border-emerald-300 dark:border-emerald-900" : "border-amber-300 dark:border-amber-900"}>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <CardTitle>Prontidão das campanhas</CardTitle>
                            <Badge variant={activeTemplatesCount > 0 ? "default" : "outline"}>
                                {completedReadinessItems}/{readinessItems.length} completo
                            </Badge>
                        </div>
                        <CardDescription>
                            Veja se este cliente já tem base suficiente para criar, enviar e medir campanhas.
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

            {/* Estatísticas */}
            {campaigns.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                                    <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Emails Enviados</p>
                                    <p className="text-2xl font-bold">{globalStats.totalSent.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                                    <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Taxa de Abertura</p>
                                    <p className="text-2xl font-bold">{globalStats.openRate.toFixed(1)}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                                    <MousePointer className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Taxa de Clique</p>
                                    <p className="text-2xl font-bold">{globalStats.clickRate.toFixed(1)}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Bounces</p>
                                    <p className="text-2xl font-bold">{globalStats.totalBounced.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filtros */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar campanhas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos os status</SelectItem>
                        {Object.entries(CAMPAIGN_STATUS_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                    <config.icon className="h-4 w-4" />
                                    {config.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Lista de Campanhas */}
            {filteredCampaigns.length === 0 ? (
                <EmptyState
                    icon={campaigns.length === 0 ? Megaphone : Search}
                    title={campaigns.length === 0 ? "Nenhuma campanha criada" : "Nenhuma campanha encontrada"}
                    description={
                        campaigns.length === 0
                            ? activeTemplatesCount === 0
                                ? "Crie ou ative um template primeiro para montar sua primeira campanha com mais rapidez."
                                : "Use seus templates para criar uma campanha e acompanhar envio, abertura e cliques."
                            : "Ajuste a busca ou o status para encontrar campanhas neste cliente."
                    }
                    primaryAction={
                        campaigns.length === 0
                            ? {
                                label: activeTemplatesCount === 0 ? "Criar template" : "Criar campanha",
                                icon: activeTemplatesCount === 0 ? FileText : Plus,
                                onClick: activeTemplatesCount === 0 ? () => router.push("/templates") : handleCreate,
                            }
                            : hasActiveFilters
                                ? {
                                    label: "Limpar filtros",
                                    icon: X,
                                    variant: "outline",
                                    onClick: () => {
                                        setSearch("")
                                        setStatusFilter("ALL")
                                    },
                                }
                                : undefined
                    }
                    secondaryAction={
                        campaigns.length === 0 && activeTemplatesCount === 0
                            ? {
                                label: "Ver leads",
                                variant: "outline",
                                onClick: () => router.push("/leads"),
                            }
                            : undefined
                    }
                />
            ) : (
                <div className="space-y-4">
                    {filteredCampaigns.map((campaign) => (
                        <CampaignCard
                            key={campaign.id}
                            campaign={campaign}
                            isLoading={isLoading === campaign.id}
                            onSend={() => handleSendClick(campaign)}
                            onDuplicate={() => handleDuplicate(campaign)}
                            onCancel={() => handleCancel(campaign)}
                            onDelete={() => handleDelete(campaign)}
                            onClick={() => handleViewDetails(campaign)}
                        />
                    ))}
                </div>
            )}

            {/* Wizard */}
            <CampaignWizard
                open={wizardOpen}
                onClose={() => setWizardOpen(false)}
                onSuccess={handleWizardSuccess}
                templates={templates}
                workspaceId={workspaceId}
            />

            {/* Send Confirmation Dialog */}
            {sendingCampaign && (
                <SendConfirmationDialog
                    open={!!sendingCampaign}
                    onClose={() => setSendingCampaign(null)}
                    onConfirm={handleConfirmSend}
                    campaignName={sendingCampaign.name}
                    templateName={sendingCampaign.template?.name || null}
                    totalRecipients={sendingCampaign.totalRecipients}
                    totalPending={sendingCampaign.totalRecipients}
                    isSequence={sendingCampaign.type === "sequence"}
                    stepsCount={sendingCampaign._count.steps || 1}
                />
            )}
        </>
    )
}
