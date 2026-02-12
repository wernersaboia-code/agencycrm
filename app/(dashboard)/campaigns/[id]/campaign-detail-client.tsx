// app/(dashboard)/campaigns/[id]/campaign-detail-client.tsx

"use client"

import { recalculateCampaignMetrics } from "@/actions/campaigns/metrics"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    ArrowLeft,
    Send,
    Copy,
    Trash2,
    RefreshCw,
    Mail,
    Calendar,
    FileText,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { getStatusConfig, calculateMetrics } from "@/lib/constants/campaign.constants"
import {
    sendCampaign,
    duplicateCampaign,
    deleteCampaign,
    getCampaignById,
} from "@/actions/campaigns"
import { cn } from "@/lib/utils"

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
    emailSends: EmailSend[]
}

interface CampaignDetailClientProps {
    campaign: Campaign
}

// ============================================
// COMPONENT
// ============================================

export function CampaignDetailClient({ campaign: initialCampaign }: CampaignDetailClientProps) {
    const router = useRouter()
    const [campaign, setCampaign] = useState<Campaign>(initialCampaign)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false)

    const statusConfig = getStatusConfig(campaign.status)
    const StatusIcon = statusConfig.icon
    const metrics = calculateMetrics(campaign)

    const canSend = campaign.status === "DRAFT" || campaign.status === "SCHEDULED"
    const canDelete = campaign.status !== "SENDING"

    // ============================================
    // HANDLERS
    // ============================================

    const handleBack = (): void => {
        router.push("/campaigns")
    }

    const handleRefresh = async (): Promise<void> => {
        setIsRefreshing(true)
        try {
            const result = await getCampaignById(campaign.id)
            if (result.success && result.data) {
                // Serialize dates
                const refreshedCampaign = {
                    ...result.data,
                    createdAt: result.data.createdAt.toISOString(),
                    updatedAt: result.data.updatedAt.toISOString(),
                    sentAt: result.data.sentAt?.toISOString() || null,
                    scheduledAt: result.data.scheduledAt?.toISOString() || null,
                    emailSends: result.data.emailSends.map((send: any) => ({
                        ...send,
                        sentAt: send.sentAt?.toISOString() || null,
                        openedAt: send.openedAt?.toISOString() || null,
                        clickedAt: send.clickedAt?.toISOString() || null,
                        repliedAt: send.repliedAt?.toISOString() || null,
                        bouncedAt: send.bouncedAt?.toISOString() || null,
                    })),
                }
                setCampaign(refreshedCampaign)
                toast.success("Métricas atualizadas!")
            }
        } catch (error) {
            toast.error("Erro ao atualizar métricas")
        } finally {
            setIsRefreshing(false)
        }
    }

    const handleSend = async (): Promise<void> => {
        setIsLoading(true)
        try {
            const result = await sendCampaign(campaign.id)
            if (result.success) {
                toast.success("Campanha enviada com sucesso!")
                await handleRefresh()
            } else {
                toast.error(result.error || "Erro ao enviar campanha")
            }
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
            toast.error("Erro ao excluir campanha")
        } finally {
            setIsLoading(false)
            setShowDeleteDialog(false)
        }
    }

    const formatDate = (date: string | null): string => {
        if (!date) return "-"
        return format(new Date(date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
    }

    const handleRecalculateMetrics = async (): Promise<void> => {
        setIsRefreshing(true)
        try {
            const result = await recalculateCampaignMetrics(campaign.id)
            if (result.success) {
                toast.success(`Métricas recalculadas! Abertos: ${result.data?.totalOpened}, Cliques: ${result.data?.totalClicked}`)
                await handleRefresh()
            } else {
                toast.error(result.error || "Erro ao recalcular")
            }
        } catch (error) {
            toast.error("Erro ao recalcular métricas")
        } finally {
            setIsRefreshing(false)
        }
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
                            <Badge
                                variant={statusConfig.badgeVariant}
                                className="gap-1"
                            >
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
                        <RefreshCw className={cn(
                            "h-4 w-4 mr-2",
                            isRefreshing && "animate-spin"
                        )} />
                        Recalcular Métricas
                    </Button>

                    {canSend && (
                        <Button onClick={handleSend} disabled={isLoading}>
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
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-3">
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
                                <FileText className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Assunto</p>
                                <p className="font-medium truncate max-w-[200px]">
                                    {campaign.template?.subject || "-"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Metrics */}
            <CampaignMetrics metrics={metrics} />

            {/* Tabs */}
            <Tabs defaultValue="sends" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="sends">
                        Envios ({campaign.emailSends.length})
                    </TabsTrigger>
                    <TabsTrigger value="opened">
                        Abertos ({campaign.totalOpened})
                    </TabsTrigger>
                    <TabsTrigger value="clicked">
                        Clicaram ({campaign.totalClicked})
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
                                emailSends={campaign.emailSends.filter(
                                    (send: EmailSend) => send.openedAt !== null
                                )}
                                isLoading={isRefreshing}
                                onRefresh={handleRefresh}
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
                                emailSends={campaign.emailSends.filter(
                                    (send: EmailSend) => send.clickedAt !== null
                                )}
                                isLoading={isRefreshing}
                                onRefresh={handleRefresh}
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
                            Essa ação não pode ser desfeita. A campanha "{campaign.name}" e todos
                            os registros de envio serão excluídos permanentemente.
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
        </div>
    )
}