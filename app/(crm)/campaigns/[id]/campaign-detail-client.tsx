// app/(crm)/campaigns/[id]/campaign-detail-client.tsx

"use client"

import { recalculateCampaignMetrics } from "@/actions/campaigns/metrics"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Send,
    Copy,
    Trash2,
    RefreshCw,
    Mail,
    Calendar,
    Phone,
    Plus,
    ThumbsUp,
    Users,
    MousePointerClick,
    MailOpen,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

import { CampaignMetrics } from "@/components/campaigns/campaign-metrics"
import { EmailSendsList } from "@/components/campaigns/email-sends-list"
import { CampaignCallsList } from "@/components/campaigns/campaign-calls-list"
import { CallModal } from "@/components/calls/CallModal"
import { getStatusConfig, calculateMetrics } from "@/lib/constants/campaign.constants"
import {
    sendCampaign,
    duplicateCampaign,
    deleteCampaign,
    getCampaignById,
} from "@/actions/campaigns"
import { getCallsByCampaign, getCampaignCallStats } from "@/actions/calls"
import { SerializedCallWithLead } from "@/types/call.types"
import type { CallResult, CampaignType } from "@prisma/client"
import { cn } from "@/lib/utils"
import { ExportCampaignButtons } from "@/components/reports/export-campaign-buttons"
import { SendConfirmationDialog } from "@/components/campaigns/send-confirmation-dialog"

// ============================================
// TYPES
// ============================================

interface EmailSend {
    id: string
    status: string
    sentAt: string | null
    openedAt: string | null
    clickedAt: string | null
    repliedAt: string | null
    bouncedAt: string | null
    bounceReason: string | null
    lead: {
        id: string
        firstName: string | null
        lastName: string | null
        email: string
        company: string | null
    }
}

interface Campaign {
    id: string
    name: string
    description: string | null
    status: string
    templateId: string | null
    template: {
        id: string
        name: string
        subject: string
    } | null
    totalRecipients: number
    totalSent: number
    totalOpened: number
    totalClicked: number
    totalReplied: number
    totalBounced: number
    scheduledAt: string | null
    sentAt: string | null
    createdAt: string
    updatedAt: string
    workspaceId: string
    type: CampaignType
    _count?: {
        steps: number
    }
    emailSends: EmailSend[]
}

interface CallStats {
    total: number
    byResult: Record<CallResult, number>
    interested: number
    meetingsScheduled: number
}

interface CampaignDetailClientProps {
    campaign: Campaign
    initialCalls: SerializedCallWithLead[]
    initialCallStats: CallStats
}

// ============================================
// COMPONENT
// ============================================

export function CampaignDetailClient({
                                         campaign: initialCampaign,
                                         initialCalls,
                                         initialCallStats,
                                     }: CampaignDetailClientProps) {
    const router = useRouter()
    const [campaign, setCampaign] = useState<Campaign>(initialCampaign)
    const [calls, setCalls] = useState<SerializedCallWithLead[]>(initialCalls)
    const [callStats, setCallStats] = useState<CallStats>(initialCallStats)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false)
    const [showSendDialog, setShowSendDialog] = useState<boolean>(false)
    const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false)
    const [editingCall, setEditingCall] = useState<SerializedCallWithLead | null>(null)
    const [activeTab, setActiveTab] = useState<string>("sends")

    const statusConfig = getStatusConfig(campaign.status)
    const StatusIcon = statusConfig.icon
    const metrics = calculateMetrics(campaign)

    const canSend = campaign.status === "DRAFT" || campaign.status === "SCHEDULED"
    const canDelete = campaign.status !== "SENDING"
    const isSequence = campaign.type === "sequence"
    const pendingCount = campaign.emailSends.filter(
        (send) => send.status === "PENDING"
    ).length
    const stepsCount = campaign._count?.steps || 1
    const deliveredCount = Math.max(campaign.totalSent - campaign.totalBounced, 0)
    const openedCount = campaign.emailSends.filter((send) => send.openedAt !== null).length
    const clickedCount = campaign.emailSends.filter((send) => send.clickedAt !== null).length
    const repliedCount = campaign.emailSends.filter((send) => send.repliedAt !== null).length
    const bouncedSends = campaign.emailSends.filter((send) => send.bouncedAt !== null || send.status === "BOUNCED")
    const openedSends = campaign.emailSends.filter((send) => send.openedAt !== null)
    const clickedSends = campaign.emailSends.filter((send) => send.clickedAt !== null)
    const repliedSends = campaign.emailSends.filter((send) => send.repliedAt !== null)
    const deliveryProgress = campaign.totalRecipients > 0
        ? Math.round((campaign.totalSent / campaign.totalRecipients) * 100)
        : 0
    const engagementProgress = deliveredCount > 0
        ? Math.round((openedCount / deliveredCount) * 100)
        : 0
    const clickProgress = openedCount > 0
        ? Math.round((clickedCount / openedCount) * 100)
        : 0

    const followUpActions = [
        {
            label: canSend ? "Enviar campanha" : "Atualizar dados",
            description: canSend
                ? `${pendingCount || campaign.totalRecipients} destinatário${(pendingCount || campaign.totalRecipients) !== 1 ? "s" : ""} aguardando envio.`
                : "Sincronize métricas antes de tomar a próxima decisão.",
            icon: canSend ? Send : RefreshCw,
            tone: canSend ? "warning" : "default",
            onClick: canSend ? () => handleSendClick() : () => handleRefresh(),
        },
        {
            label: repliedCount > 0 ? "Ver respostas" : clickedCount > 0 ? "Ver cliques" : "Ver aberturas",
            description: repliedCount > 0
                ? `${repliedCount} lead${repliedCount !== 1 ? "s" : ""} responderam.`
                : clickedCount > 0
                    ? `${clickedCount} lead${clickedCount !== 1 ? "s" : ""} clicaram em links.`
                    : `${openedCount} lead${openedCount !== 1 ? "s" : ""} abriram o email.`,
            icon: repliedCount > 0 ? ThumbsUp : clickedCount > 0 ? MousePointerClick : MailOpen,
            tone: repliedCount > 0 || clickedCount > 0 || openedCount > 0 ? "success" : "default",
            onClick: () => setActiveTab(repliedCount > 0 ? "replied" : clickedCount > 0 ? "clicked" : "opened"),
        },
        {
            label: callStats.total > 0 ? "Revisar ligações" : "Registrar ligação",
            description: callStats.total > 0
                ? `${callStats.interested} interessado${callStats.interested !== 1 ? "s" : ""} e ${callStats.meetingsScheduled} reunião${callStats.meetingsScheduled !== 1 ? "ões" : ""}.`
                : "Transforme sinais de interesse em acompanhamento comercial.",
            icon: Phone,
            tone: callStats.interested > 0 || callStats.meetingsScheduled > 0 ? "success" : "default",
            onClick: callStats.total > 0 ? () => setActiveTab("calls") : () => handleOpenCallModal(),
        },
    ]

    // ============================================
    // HANDLERS
    // ============================================

    const handleBack = (): void => {
        router.push("/campaigns")
    }

    const handleRefresh = useCallback(async (): Promise<void> => {
        setIsRefreshing(true)
        try {
            const [campaignResult, newCalls, newCallStats] = await Promise.all([
                getCampaignById(campaign.id),
                getCallsByCampaign(campaign.id),
                getCampaignCallStats(campaign.id),
            ])

            if (campaignResult.success && campaignResult.data) {
                const refreshedCampaign = {
                    ...campaignResult.data,
                    createdAt: campaignResult.data.createdAt.toISOString(),
                    updatedAt: campaignResult.data.updatedAt.toISOString(),
                    sentAt: campaignResult.data.sentAt?.toISOString() || null,
                    scheduledAt: campaignResult.data.scheduledAt?.toISOString() || null,
                    emailSends: campaignResult.data.emailSends.map((send) => ({
                        ...send,
                        sentAt: send.sentAt?.toISOString() || null,
                        openedAt: send.openedAt?.toISOString() || null,
                        clickedAt: send.clickedAt?.toISOString() || null,
                        repliedAt: send.repliedAt?.toISOString() || null,
                        bouncedAt: send.bouncedAt?.toISOString() || null,
                    })),
                }
                setCampaign(refreshedCampaign)
            }

            setCalls(newCalls)
            setCallStats(newCallStats)
            toast.success("Dados atualizados!")
        } catch {
            toast.error("Erro ao atualizar dados")
        } finally {
            setIsRefreshing(false)
        }
    }, [campaign.id])

    const handleSendClick = (): void => {
        setShowSendDialog(true)
    }

    const handleConfirmSend = async (): Promise<void> => {
        setIsLoading(true)
        try {
            const result = await sendCampaign(campaign.id)
            if (result.success) {
                toast.success("Campanha enviada com sucesso!")
                setShowSendDialog(false)
                await handleRefresh()
            } else {
                toast.error(result.error || "Erro ao enviar campanha")
            }
        } catch {
            toast.error("Erro ao enviar campanha")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDuplicate = async (): Promise<void> => {
        setIsLoading(true)
        try {
            const result = await duplicateCampaign(campaign.id)
            if (result.success && result.data) {
                toast.success("Campanha duplicada!")
                router.push(`/campaigns/${result.data.id}`)
            } else {
                toast.error(result.error || "Erro ao duplicar")
            }
        } catch {
            toast.error("Erro ao duplicar campanha")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (): Promise<void> => {
        setIsLoading(true)
        try {
            const result = await deleteCampaign(campaign.id)
            if (result.success) {
                toast.success("Campanha excluída!")
                router.push("/campaigns")
            } else {
                toast.error(result.error || "Erro ao excluir")
            }
        } catch {
            toast.error("Erro ao excluir campanha")
        } finally {
            setIsLoading(false)
            setShowDeleteDialog(false)
        }
    }

    const handleRecalculateMetrics = async (): Promise<void> => {
        setIsRefreshing(true)
        try {
            const result = await recalculateCampaignMetrics(campaign.id)
            if (result.success) {
                toast.success(
                    `Métricas recalculadas! Abertos: ${result.data?.totalOpened}, Cliques: ${result.data?.totalClicked}`
                )
                await handleRefresh()
            } else {
                toast.error(result.error || "Erro ao recalcular")
            }
        } catch {
            toast.error("Erro ao recalcular métricas")
        } finally {
            setIsRefreshing(false)
        }
    }

    const handleOpenCallModal = useCallback((): void => {
        setEditingCall(null)
        setIsCallModalOpen(true)
    }, [])

    const handleEditCall = useCallback((call: SerializedCallWithLead): void => {
        setEditingCall(call)
        setIsCallModalOpen(true)
    }, [])

    const handleCloseCallModal = useCallback((): void => {
        setIsCallModalOpen(false)
        setEditingCall(null)
    }, [])

    const handleCallSaved = useCallback(async (): Promise<void> => {
        handleCloseCallModal()
        await handleRefresh()
        toast.success(editingCall ? "Ligação atualizada" : "Ligação registrada")
    }, [editingCall, handleCloseCallModal, handleRefresh])

    const formatDate = (date: string | null): string => {
        if (!date) return "-"
        return format(new Date(date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
    }

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{campaign.name}</h1>
                            <Badge variant={statusConfig.badgeVariant} className="gap-1">
                                <StatusIcon className="h-3.5 w-3.5" />
                                {statusConfig.label}
                            </Badge>
                        </div>
                        {campaign.description && (
                            <p className="text-muted-foreground mt-1">{campaign.description}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRecalculateMetrics}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                        Recalcular Métricas
                    </Button>
                    {canSend && (
                        <Button onClick={handleSendClick} disabled={isLoading}>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Campanha
                        </Button>
                    )}

                    <Button variant="outline" onClick={handleDuplicate} disabled={isLoading}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                    </Button>

                    {canDelete && (
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                            disabled={isLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                        </Button>
                    )}
                    <ExportCampaignButtons
                        campaignId={campaign.id}
                        campaignName={campaign.name}
                    />
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Template</p>
                                <p className="font-medium">{campaign.template?.name || "Sem template"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {campaign.sentAt ? "Enviada em" : "Criada em"}
                                </p>
                                <p className="font-medium">
                                    {formatDate(campaign.sentAt || campaign.createdAt)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Phone className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Ligações</p>
                                <p className="font-medium">{callStats.total} realizadas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <ThumbsUp className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Resultados</p>
                                <p className="font-medium">
                                    {callStats.interested} interessados, {callStats.meetingsScheduled} reuniões
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Metrics */}
            <CampaignMetrics metrics={metrics} />

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Próximas ações</CardTitle>
                        <CardDescription>
                            O que merece atenção agora nesta campanha
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-3">
                        {followUpActions.map((action) => (
                            <button
                                key={action.label}
                                type="button"
                                onClick={action.onClick}
                                className={cn(
                                    "flex min-h-[116px] items-start justify-between gap-3 rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted/50",
                                    action.tone === "warning" && "border-amber-300 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20",
                                    action.tone === "success" && "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                                )}
                            >
                                <span className="flex min-w-0 gap-3">
                                    {action.tone === "success" ? (
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                    ) : action.tone === "warning" ? (
                                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                    ) : (
                                        <action.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                                    )}
                                    <span className="space-y-1">
                                        <span className="block font-medium leading-tight">{action.label}</span>
                                        <span className="block text-sm text-muted-foreground">{action.description}</span>
                                    </span>
                                </span>
                                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                            </button>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Funil da campanha</CardTitle>
                        <CardDescription>
                            Entrega, abertura e cliques em relação ao passo anterior
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    Enviados
                                </span>
                                <span className="font-medium">{campaign.totalSent}/{campaign.totalRecipients}</span>
                            </div>
                            <Progress value={deliveryProgress} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <MailOpen className="h-4 w-4" />
                                    Aberturas
                                </span>
                                <span className="font-medium">{openedCount}/{deliveredCount}</span>
                            </div>
                            <Progress value={engagementProgress} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <MousePointerClick className="h-4 w-4" />
                                    Cliques
                                </span>
                                <span className="font-medium">{clickedCount}/{openedCount}</span>
                            </div>
                            <Progress value={clickProgress} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="sends">
                        <Mail className="h-4 w-4 mr-2" />
                        Envios ({campaign.emailSends.length})
                    </TabsTrigger>
                    <TabsTrigger value="opened">
                        Abertos ({campaign.totalOpened})
                    </TabsTrigger>
                    <TabsTrigger value="clicked">
                        Clicaram ({campaign.totalClicked})
                    </TabsTrigger>
                    <TabsTrigger value="replied">
                        Responderam ({repliedCount})
                    </TabsTrigger>
                    <TabsTrigger value="bounced">
                        Bounces ({bouncedSends.length})
                    </TabsTrigger>
                    <TabsTrigger value="calls">
                        <Phone className="h-4 w-4 mr-2" />
                        Ligações ({callStats.total})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sends">
                    <Card>
                        <CardHeader>
                            <CardTitle>Todos os Envios</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EmailSendsList
                                emailSends={campaign.emailSends}
                                isLoading={isRefreshing}
                                onRefresh={handleRefresh}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="opened">
                    <Card>
                        <CardHeader>
                            <CardTitle>Emails Abertos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EmailSendsList
                                emailSends={openedSends}
                                isLoading={isRefreshing}
                                onRefresh={handleRefresh}
                                emptyTitle="Nenhuma abertura registrada"
                                emptyDescription="Quando leads abrirem o email, eles aparecerão aqui para acompanhamento."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="clicked">
                    <Card>
                        <CardHeader>
                            <CardTitle>Clicaram em Links</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EmailSendsList
                                emailSends={clickedSends}
                                isLoading={isRefreshing}
                                onRefresh={handleRefresh}
                                emptyTitle="Nenhum clique registrado"
                                emptyDescription="Cliques indicam leads com maior intenção para priorizar contato."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="replied">
                    <Card>
                        <CardHeader>
                            <CardTitle>Responderam</CardTitle>
                            <CardDescription>
                                Leads que responderam a campanha e merecem prioridade comercial
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmailSendsList
                                emailSends={repliedSends}
                                isLoading={isRefreshing}
                                onRefresh={handleRefresh}
                                emptyTitle="Nenhuma resposta registrada"
                                emptyDescription="Respostas aparecerão aqui quando os leads retornarem o contato."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bounced">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bounces</CardTitle>
                            <CardDescription>
                                Emails com falha de entrega para revisar a qualidade da base
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmailSendsList
                                emailSends={bouncedSends}
                                isLoading={isRefreshing}
                                onRefresh={handleRefresh}
                                emptyTitle="Nenhum bounce registrado"
                                emptyDescription="Ótimo sinal: até agora não há falhas de entrega nesta campanha."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="calls">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Ligações da Campanha</CardTitle>
                                <CardDescription>
                                    Ligações vinculadas a esta campanha de prospecção
                                </CardDescription>
                            </div>
                            <Button size="sm" onClick={handleOpenCallModal}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Ligação
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <CampaignCallsList
                                calls={calls}
                                isLoading={isRefreshing}
                                onEdit={handleEditCall}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Delete Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. A campanha &quot;{campaign.name}&quot; e todos os
                            registros de envio serão excluídos permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Send Confirmation Dialog */}
            <SendConfirmationDialog
                open={showSendDialog}
                onClose={() => setShowSendDialog(false)}
                onConfirm={handleConfirmSend}
                campaignName={campaign.name}
                templateName={campaign.template?.name || null}
                totalRecipients={campaign.totalRecipients}
                totalPending={isSequence ? campaign.totalRecipients : pendingCount}
                isSequence={isSequence}
                stepsCount={stepsCount}
            />

            {/* Call Modal */}

            {/* Call Modal */}
            <CallModal
                isOpen={isCallModalOpen}
                onClose={handleCloseCallModal}
                onSaved={handleCallSaved}
                call={editingCall}
                workspaceId={campaign.workspaceId}
                preselectedLeadId={null}
                preselectedCampaignId={campaign.id}
            />
        </div>
    )
}
