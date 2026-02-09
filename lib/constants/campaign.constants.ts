// lib/constants/campaign.constants.ts

import { CampaignStatus } from "@prisma/client"
import {
    FileEdit,
    Clock,
    Send,
    CheckCircle,
    PauseCircle,
    XCircle,
    LucideIcon,
} from "lucide-react"

// ============================================================
// CONFIGURAÇÃO DE STATUS
// ============================================================

interface StatusConfig {
    label: string
    description: string
    icon: LucideIcon
    color: string
    bgColor: string
    badgeVariant: "default" | "secondary" | "destructive" | "outline"
}

export const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, StatusConfig> = {
    DRAFT: {
        label: "Rascunho",
        description: "Campanha em edição",
        icon: FileEdit,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        badgeVariant: "secondary",
    },
    SCHEDULED: {
        label: "Agendada",
        description: "Aguardando data de envio",
        icon: Clock,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        badgeVariant: "outline",
    },
    SENDING: {
        label: "Enviando",
        description: "Envio em andamento",
        icon: Send,
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        badgeVariant: "default",
    },
    SENT: {
        label: "Enviada",
        description: "Todos os emails foram enviados",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
        badgeVariant: "default",
    },
    PAUSED: {
        label: "Pausada",
        description: "Envio pausado",
        icon: PauseCircle,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        badgeVariant: "secondary",
    },
    CANCELLED: {
        label: "Cancelada",
        description: "Campanha cancelada",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
        badgeVariant: "destructive",
    },
}

// ============================================================
// HELPERS
// ============================================================

export function getStatusConfig(status: CampaignStatus): StatusConfig {
    return CAMPAIGN_STATUS_CONFIG[status] || CAMPAIGN_STATUS_CONFIG.DRAFT
}

export function getStatusLabel(status: CampaignStatus): string {
    return getStatusConfig(status).label
}

export function getStatusOptions() {
    return Object.entries(CAMPAIGN_STATUS_CONFIG).map(([value, config]) => ({
        value: value as CampaignStatus,
        label: config.label,
    }))
}

// ============================================================
// MÉTRICAS
// ============================================================

export interface CampaignMetrics {
    totalRecipients: number
    totalSent: number
    totalOpened: number
    totalClicked: number
    totalReplied: number
    totalBounced: number
    openRate: number
    clickRate: number
    replyRate: number
    bounceRate: number
}

export function calculateMetrics(campaign: {
    totalRecipients: number
    totalSent: number
    totalOpened: number
    totalClicked: number
    totalReplied: number
    totalBounced: number
}): CampaignMetrics {
    const { totalRecipients, totalSent, totalOpened, totalClicked, totalReplied, totalBounced } = campaign

    const safeDiv = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0)

    return {
        ...campaign,
        openRate: safeDiv(totalOpened, totalSent),
        clickRate: safeDiv(totalClicked, totalOpened),
        replyRate: safeDiv(totalReplied, totalSent),
        bounceRate: safeDiv(totalBounced, totalSent),
    }
}