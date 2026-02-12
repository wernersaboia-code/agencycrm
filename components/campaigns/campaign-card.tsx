// components/campaigns/campaign-card.tsx

"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    MoreHorizontal,
    Send,
    Copy,
    Trash2,
    XCircle,
    Users,
    Mail,
    Eye,
    MousePointer,
    MessageSquare,
    AlertTriangle,
    Clock,
    Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getStatusConfig, calculateMetrics } from "@/lib/constants/campaign.constants"
import type { CampaignWithRelations } from "@/actions/campaigns"

// ============================================================
// TIPOS
// ============================================================

interface CampaignCardProps {
    campaign: CampaignWithRelations
    isLoading: boolean
    onSend: () => void
    onDuplicate: () => void
    onCancel: () => void
    onDelete: () => void
    onClick?: () => void
}

// ============================================================
// COMPONENTE
// ============================================================

export function CampaignCard({
                                 campaign,
                                 isLoading,
                                 onSend,
                                 onDuplicate,
                                 onCancel,
                                 onDelete,
                                 onClick,
                             }: CampaignCardProps) {
    const statusConfig = getStatusConfig(campaign.status)
    const StatusIcon = statusConfig.icon
    const metrics = calculateMetrics(campaign)

    const canSend = campaign.status === "DRAFT" || campaign.status === "SCHEDULED"
    const canCancel = campaign.status !== "SENT" && campaign.status !== "CANCELLED"
    const canDelete = campaign.status !== "SENDING"

    const formattedDate = format(
        new Date(campaign.updatedAt),
        "dd MMM yyyy 'às' HH:mm",
        { locale: ptBR }
    )

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <Card
            className={cn(
                "transition-all hover:shadow-md cursor-pointer",
                isLoading && "pointer-events-none opacity-50"
            )}
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                            <div className={cn("p-2 rounded-md shrink-0", statusConfig.bgColor)}>
                                <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-lg truncate">{campaign.name}</h3>
                                    <Badge variant={statusConfig.badgeVariant}>
                                        {statusConfig.label}
                                    </Badge>
                                </div>
                                {campaign.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                        {campaign.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    {campaign.template && (
                                        <span className="flex items-center gap-1">
                                            <Mail className="h-3.5 w-3.5" />
                                            {campaign.template.name}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5" />
                                        {campaign.totalRecipients} destinatários
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formattedDate}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Métricas (só mostra se foi enviada) */}
                    {campaign.status === "SENT" && campaign.totalSent > 0 && (
                        <div className="flex items-center gap-6 py-2 px-4 bg-muted/50 rounded-lg">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-green-600">
                                    <Eye className="h-4 w-4" />
                                    <span className="font-semibold">{metrics.openRate.toFixed(0)}%</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Abertura</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-purple-600">
                                    <MousePointer className="h-4 w-4" />
                                    <span className="font-semibold">{metrics.clickRate.toFixed(0)}%</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Cliques</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-blue-600">
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="font-semibold">{campaign.totalReplied}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Respostas</p>
                            </div>
                            {campaign.totalBounced > 0 && (
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-red-600">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="font-semibold">{campaign.totalBounced}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Bounces</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Progresso (se estiver enviando) */}
                    {campaign.status === "SENDING" && (
                        <div className="w-48">
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Enviando...</span>
                                <span className="font-medium">
                                    {campaign.totalSent}/{campaign.totalRecipients}
                                </span>
                            </div>
                            <Progress
                                value={(campaign.totalSent / campaign.totalRecipients) * 100}
                                className="h-2"
                            />
                        </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                        {canSend && (
                            <Button
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onSend()
                                }}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Enviar
                                    </>
                                )}
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" disabled={isLoading}>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    onDuplicate()
                                }}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicar
                                </DropdownMenuItem>
                                {canCancel && (
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation()
                                        onCancel()
                                    }}>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancelar
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {canDelete && (
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDelete()
                                        }}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}