// types/call.types.ts
import { Call, CallResult } from "@prisma/client"

export interface CallWithLead extends Call {
    lead: {
        id: string
        firstName: string
        lastName: string | null
        email: string
        phone: string | null
        company: string | null
    }
}

export interface CallWithLeadAndCampaign extends Call {
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

export interface CreateCallDTO {
    leadId: string
    workspaceId: string
    campaignId?: string | null
    result: CallResult
    duration?: number | null
    notes?: string | null
    followUpAt?: Date | null
    calledAt?: Date
}

export interface UpdateCallDTO {
    result?: CallResult
    duration?: number | null
    notes?: string | null
    followUpAt?: Date | null
    calledAt?: Date
}

export interface CallFilters {
    result?: CallResult
    dateFrom?: string
    dateTo?: string
    search?: string
    hasFollowUp?: boolean
    leadId?: string
    campaignId?: string
}

export interface CallStats {
    total: number
    answered: number
    answerRate: number
    positiveResults: number
    positiveRate: number
    byResult: Record<CallResult, number>
}

export interface PendingCallback extends CallWithLeadAndCampaign {
    isOverdue: boolean
    isToday: boolean
    isThisWeek: boolean
    daysUntil: number
}

export interface CallbacksSummary {
    overdue: PendingCallback[]
    today: PendingCallback[]
    thisWeek: PendingCallback[]
    later: PendingCallback[]
    overdueCount: number
    todayCount: number
    thisWeekCount: number
    laterCount: number
}

export interface SerializedCall {
    id: string
    leadId: string
    workspaceId: string
    campaignId: string | null
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

export function serializeCall(call: Call): SerializedCall {
    return {
        ...call,
        followUpAt: call.followUpAt?.toISOString() || null,
        calledAt: call.calledAt.toISOString(),
        createdAt: call.createdAt.toISOString(),
        updatedAt: call.updatedAt.toISOString(),
    }
}

export function serializeCallWithLead(
    call: CallWithLeadAndCampaign
): SerializedCallWithLead {
    return {
        ...serializeCall(call),
        lead: call.lead,
        campaign: call.campaign || null,
    }
}