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

export interface SequenceStep {
    id: string
    order: number
    templateId: string | null
    subject: string
    content: string
    delayDays: number
    delayHours: number
    condition: StepCondition
}

export type StepCondition =
    | "always"
    | "not_opened"
    | "opened"
    | "not_clicked"
    | "clicked"

export const STEP_CONDITIONS = [
    { value: "always" as const, label: "Sempre (após o delay)", description: "Envia independente do que aconteceu" },
    { value: "not_opened" as const, label: "Se NÃO abriu", description: "Só envia se não abriu o email anterior" },
    { value: "opened" as const, label: "Se abriu", description: "Só envia se abriu o email anterior" },
    { value: "not_clicked" as const, label: "Se NÃO clicou", description: "Só envia se não clicou em nenhum link" },
    { value: "clicked" as const, label: "Se clicou", description: "Só envia se clicou em algum link" },
]

export const MAX_SEQUENCE_STEPS = 5

export function serializeCampaign(campaign: Campaign): SerializedCampaign {
    return {
        ...campaign,
        scheduledAt: campaign.scheduledAt?.toISOString() || null,
        sentAt: campaign.sentAt?.toISOString() || null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
    }
}