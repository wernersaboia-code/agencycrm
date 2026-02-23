// types/campaign.types.ts
import { Campaign, CampaignStatus, EmailSend, EmailTemplate } from "@prisma/client"

export interface CampaignWithRelations extends Campaign {
    template?: EmailTemplate | null
    emailSends?: EmailSend[]
    _count?: {
        emailSends: number
        calls: number
    }
}

export interface CampaignStats {
    total: number
    byStatus: Record<CampaignStatus, number>
    totalSent: number
    totalOpened: number
    totalClicked: number
    avgOpenRate: number
    avgClickRate: number
}

export interface SerializedCampaign {
    id: string
    name: string
    description: string | null
    status: CampaignStatus
    templateId: string | null
    subject: string | null
    body: string | null
    totalRecipients: number
    totalSent: number
    totalOpened: number
    totalClicked: number
    totalReplied: number
    totalBounced: number
    scheduledAt: string | null
    sentAt: string | null
    workspaceId: string
    createdAt: string
    updatedAt: string
}

export function serializeCampaign(campaign: Campaign): SerializedCampaign {
    return {
        ...campaign,
        scheduledAt: campaign.scheduledAt?.toISOString() || null,
        sentAt: campaign.sentAt?.toISOString() || null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
    }
}