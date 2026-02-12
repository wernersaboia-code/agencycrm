// app/(dashboard)/campaigns/campaigns-client.tsx

"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
    Plus,
    Search,
    Send,
    Mail,
    MousePointer,
    Eye,
    MessageSquare,
    AlertTriangle,
    Filter,
    Megaphone,
} from "lucide-react"
import { toast } from "sonner"
import { CampaignStatus } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { CampaignCard } from "@/components/campaigns/campaign-card"
import { CampaignWizard } from "@/components/campaigns/campaign-wizard"
import {
    deleteCampaign,
    duplicateCampaign,
    sendCampaign,
    cancelCampaign,
    type CampaignWithRelations,
} from "@/actions/campaigns"
import type { TemplateWithStats } from "@/actions/templates"
import {
    CAMPAIGN_STATUS_CONFIG,
    calculateMetrics,
} from "@/lib/constants/campaign.constants"

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

    // Filtrar campanhas
    const filteredCampaigns = useMemo(() => {
        return campaigns.filter((campaign) => {
            // Filtro de busca
            if (search) {
                const searchLower = search.toLowerCase()
                const matchesSearch =
                    campaign.name.toLowerCase().includes(searchLower) ||
                    campaign.description?.toLowerCase().includes(searchLower) ||
                    campaign.template?.name.toLowerCase().includes(searchLower)
                if (!matchesSearch) return false
            }

            // Filtro de status
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
            sentCampaigns: campaigns.filter((c) => c.status === "SENT").length, // Renomeado
            totalSent: totals.sent,        // Emails enviados
            totalOpened: totals.opened,
            totalClicked: totals.clicked,
            totalBounced: totals.bounced,
            openRate: totals.sent > 0 ? (totals.opened / totals.sent) * 100 : 0,
            clickRate: totals.opened > 0 ? (totals.clicked / totals.opened) * 100 : 0,
        }
    }, [campaigns])

    // Handlers
    const handleCreate = () => {
        if (templates.length === 0) {
            toast.error("Crie pelo menos um template antes de criar uma campanha")
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

    const handleSend = async (campaign: CampaignWithRelations) => {
        if (!confirm(`Enviar campanha "${campaign.name}" para ${campaign.totalRecipients} leads?`)) {
            return
        }

        setIsLoading(campaign.id)
        const result = await sendCampaign(campaign.id)
        setIsLoading(null)

        if (result.success) {
            toast.success("Campanha enviada com sucesso!")
            router.refresh()
        } else {
            toast.error(result.error || "Erro ao enviar")
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

            {/* Estatísticas */}
            {campaigns.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Card Emails Enviados */}
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
                <div className="text-center py-12 border rounded-lg bg-muted/30">
                    <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg mb-2">
                        {campaigns.length === 0
                            ? "Nenhuma campanha criada"
                            : "Nenhuma campanha encontrada"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        {campaigns.length === 0
                            ? "Crie sua primeira campanha para começar a enviar emails."
                            : "Tente ajustar os filtros de busca."}
                    </p>
                    {campaigns.length === 0 && (
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Campanha
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredCampaigns.map((campaign) => (
                        <CampaignCard
                            key={campaign.id}
                            campaign={campaign}
                            isLoading={isLoading === campaign.id}
                            onSend={() => handleSend(campaign)}
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
        </>
    )
}