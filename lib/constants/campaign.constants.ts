// lib/constants/campaign.constants.ts

import {
    FileEdit,
    Clock,
    Send,
    CheckCircle,
    Pause,
    XCircle,
    type LucideIcon
} from "lucide-react"

// ============================================
// TYPES
// ============================================

export interface CampaignStatusConfig {
    label: string
    color: string
    bgColor: string
    icon: LucideIcon
    badgeVariant: "default" | "secondary" | "destructive" | "outline"
}

export interface CampaignMetrics {
    total: number
    sent: number
    opened: number
    clicked: number
    replied: number
    bounced: number
    pending: number
    openRate: number
    clickRate: number
    replyRate: number
    clickToOpenRate: number
}

// ============================================
// STATUS CONFIG
// ============================================

export const CAMPAIGN_STATUS_CONFIG: Record<string, CampaignStatusConfig> = {
    DRAFT: {
        label: "Rascunho",
        color: "text-slate-600",
        bgColor: "bg-slate-100",
        icon: FileEdit,
        badgeVariant: "secondary",
    },
    SCHEDULED: {
        label: "Agendada",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        icon: Clock,
        badgeVariant: "outline",
    },
    SENDING: {
        label: "Enviando",
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        icon: Send,
        badgeVariant: "default",
    },
    SENT: {
        label: "Enviada",
        color: "text-green-600",
        bgColor: "bg-green-100",
        icon: CheckCircle,
        badgeVariant: "default",
    },
    PAUSED: {
        label: "Pausada",
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        icon: Pause,
        badgeVariant: "outline",
    },
    CANCELLED: {
        label: "Cancelada",
        color: "text-red-600",
        bgColor: "bg-red-100",
        icon: XCircle,
        badgeVariant: "destructive",
    },
}

/**
 * Get status config with fallback
 */
export function getStatusConfig(status: string): CampaignStatusConfig {
    return CAMPAIGN_STATUS_CONFIG[status] || CAMPAIGN_STATUS_CONFIG.DRAFT
}

// ============================================
// METRICS CALCULATION
// ============================================

interface CampaignForMetrics {
    totalRecipients: number
    totalSent: number
    totalOpened: number
    totalClicked: number
    totalReplied: number
    totalBounced: number
}

/**
 * Calculate campaign metrics with rates
 */
export function calculateMetrics(campaign: CampaignForMetrics): CampaignMetrics {
    const total = campaign.totalRecipients
    const sent = campaign.totalSent
    const opened = campaign.totalOpened
    const clicked = campaign.totalClicked
    const replied = campaign.totalReplied
    const bounced = campaign.totalBounced
    const pending = total - sent - bounced

    // Calculate rates (avoid division by zero)
    const delivered = sent - bounced
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0
    const replyRate = delivered > 0 ? (replied / delivered) * 100 : 0
    const clickToOpenRate = opened > 0 ? (clicked / opened) * 100 : 0

    return {
        total,
        sent,
        opened,
        clicked,
        replied,
        bounced,
        pending,
        openRate: Math.round(openRate * 10) / 10,
        clickRate: Math.round(clickRate * 10) / 10,
        replyRate: Math.round(replyRate * 10) / 10,
        clickToOpenRate: Math.round(clickToOpenRate * 10) / 10,
    }
}