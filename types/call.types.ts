// types/call.types.ts

import { Call, Lead, CallResult, Campaign } from "@prisma/client"

// ============================================
// TIPOS BASE
// ============================================

export interface CallWithLead extends Call {
    lead: Pick<Lead, "id" | "firstName" | "lastName" | "email" | "phone" | "company">
}

export interface CallWithDetails extends Call {
    lead: Lead
    campaign?: Pick<Campaign, "id" | "name"> | null
}

export interface CallWithLeadAndCampaign extends Call {
    lead: Pick<Lead, "id" | "firstName" | "lastName" | "email" | "phone" | "company">
    campaign?: Pick<Campaign, "id" | "name"> | null
}

// ============================================
// DTOs - CREATE / UPDATE
// ============================================

export interface CreateCallDTO {
    leadId: string
    workspaceId: string
    result: CallResult
    duration?: number | null
    notes?: string | null
    followUpAt?: Date | string | null
    calledAt?: Date | string
    campaignId?: string | null  // NOVO
}

export interface UpdateCallDTO {
    result?: CallResult
    duration?: number | null
    notes?: string | null
    followUpAt?: Date | string | null
    calledAt?: Date | string
    campaignId?: string | null  // NOVO
}

// ============================================
// FILTROS
// ============================================

export interface CallFilters {
    result?: CallResult | CallResult[]
    dateFrom?: Date | string
    dateTo?: Date | string
    hasFollowUp?: boolean
    leadId?: string
    campaignId?: string  // NOVO
    search?: string
}

// ============================================
// CALLBACKS PENDENTES
// ============================================

export interface PendingCallback extends CallWithLeadAndCampaign {
    isOverdue: boolean
    daysUntil: number
}

export interface CallbacksSummary {
    overdue: PendingCallback[]
    today: PendingCallback[]
    thisWeek: PendingCallback[]
    later: PendingCallback[]
}

// ============================================
// FORMULÁRIO
// ============================================

export interface CallFormData {
    result: CallResult
    duration: string
    notes: string
    followUpAt: string
    calledAt: string
    campaignId: string  // NOVO (vazio = sem campanha)
}

// ============================================
// SERIALIZADO (para client components)
// ============================================

export interface SerializedCall {
    id: string
    leadId: string
    workspaceId: string
    campaignId: string | null  // NOVO
    result: CallResult
    duration: number | null
    notes: string | null
    followUpAt: string | null
    calledAt: string
    createdAt: string
    updatedAt: string
}

export interface SerializedCallWithLead extends SerializedCall {
    lead: {
        id: string
        firstName: string
        lastName: string | null
        email: string
        phone: string | null
        company: string | null
    }
    campaign?: {
        id: string
        name: string
    } | null
}

// ============================================
// HELPERS DE SERIALIZAÇÃO
// ============================================

export function serializeCall(call: Call): SerializedCall {
    return {
        id: call.id,
        leadId: call.leadId,
        workspaceId: call.workspaceId,
        campaignId: call.campaignId,  // NOVO
        result: call.result,
        duration: call.duration,
        notes: call.notes,
        followUpAt: call.followUpAt?.toISOString() ?? null,
        calledAt: call.calledAt.toISOString(),
        createdAt: call.createdAt.toISOString(),
        updatedAt: call.updatedAt.toISOString(),
    }
}

export function serializeCallWithLead(call: CallWithLeadAndCampaign): SerializedCallWithLead {
    return {
        ...serializeCall(call),
        lead: {
            id: call.lead.id,
            firstName: call.lead.firstName,
            lastName: call.lead.lastName,
            email: call.lead.email,
            phone: call.lead.phone,
            company: call.lead.company,
        },
        campaign: call.campaign ? {
            id: call.campaign.id,
            name: call.campaign.name,
        } : null,
    }
}