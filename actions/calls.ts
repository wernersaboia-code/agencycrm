// actions/calls.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import {
    createCallSchema,
    updateCallSchema,
    CreateCallInput,
    UpdateCallInput,
} from "@/lib/validations/call.validations"
import {
    CallWithLeadAndCampaign,
    CallFilters,
    PendingCallback,
    CallbacksSummary,
    serializeCallWithLead,
    SerializedCallWithLead,
} from "@/types/call.types"
import { CallResult, LeadStatus } from "@prisma/client"

// ============================================
// TYPES
// ============================================

interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

// ============================================
// HELPERS
// ============================================

async function verifyWorkspaceAccess(workspaceId: string): Promise<boolean> {
    const user = await getAuthenticatedUser()
    if (!user) return false

    const workspace = await prisma.workspace.findFirst({
        where: { id: workspaceId, userId: user.id },
    })

    return !!workspace
}

function getLeadStatusFromCallResult(result: CallResult): LeadStatus | null {
    switch (result) {
        case "INTERESTED":
            return LeadStatus.INTERESTED
        case "NOT_INTERESTED":
            return LeadStatus.NOT_INTERESTED
        case "MEETING_SCHEDULED":
            return LeadStatus.NEGOTIATING
        case "ANSWERED":
        case "CALLBACK":
            return LeadStatus.CALLED
        case "WRONG_NUMBER":
            return LeadStatus.BOUNCED
        default:
            return null
    }
}

// Include padrão para queries
const callInclude = {
    lead: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,  // ← já está aqui, confirma que está
            company: true,
        },
    },
    campaign: {
        select: {
            id: true,
            name: true,
        },
    },
}

// ============================================
// GET CALLS
// ============================================

export async function getCalls(
    workspaceId: string,
    filters?: CallFilters
): Promise<SerializedCallWithLead[]> {
    const hasAccess = await verifyWorkspaceAccess(workspaceId)
    if (!hasAccess) return []

    const where: any = { workspaceId }

    if (filters?.result) {
        where.result = Array.isArray(filters.result)
            ? { in: filters.result }
            : filters.result
    }

    if (filters?.dateFrom || filters?.dateTo) {
        where.calledAt = {}
        if (filters.dateFrom) where.calledAt.gte = new Date(filters.dateFrom)
        if (filters.dateTo) where.calledAt.lte = new Date(filters.dateTo)
    }

    if (filters?.hasFollowUp !== undefined) {
        where.followUpAt = filters.hasFollowUp ? { not: null } : null
    }

    if (filters?.leadId) {
        where.leadId = filters.leadId
    }

    // NOVO: Filtro por campanha
    if (filters?.campaignId) {
        where.campaignId = filters.campaignId
    }

    if (filters?.search) {
        const searchTerm = filters.search.trim()
        where.OR = [
            { notes: { contains: searchTerm, mode: "insensitive" } },
            { lead: { firstName: { contains: searchTerm, mode: "insensitive" } } },
            { lead: { lastName: { contains: searchTerm, mode: "insensitive" } } },
            { lead: { company: { contains: searchTerm, mode: "insensitive" } } },
        ]
    }

    const calls = await prisma.call.findMany({
        where,
        include: callInclude,
        orderBy: { calledAt: "desc" },
    })

    return calls.map((call) => serializeCallWithLead(call as CallWithLeadAndCampaign))
}

// ============================================
// GET CALL BY ID
// ============================================

export async function getCallById(id: string): Promise<SerializedCallWithLead | null> {
    const user = await getAuthenticatedUser()
    if (!user) return null

    const call = await prisma.call.findFirst({
        where: {
            id,
            workspace: { userId: user.id },
        },
        include: callInclude,
    })

    return call ? serializeCallWithLead(call as CallWithLeadAndCampaign) : null
}

// ============================================
// GET CALLS BY LEAD
// ============================================

export async function getCallsByLead(leadId: string): Promise<SerializedCallWithLead[]> {
    const user = await getAuthenticatedUser()
    if (!user) return []

    const calls = await prisma.call.findMany({
        where: {
            leadId,
            workspace: { userId: user.id },
        },
        include: callInclude,
        orderBy: { calledAt: "desc" },
    })

    return calls.map((call) => serializeCallWithLead(call as CallWithLeadAndCampaign))
}

// ============================================
// GET CALLS BY CAMPAIGN (NOVO!)
// ============================================

export async function getCallsByCampaign(campaignId: string): Promise<SerializedCallWithLead[]> {
    const user = await getAuthenticatedUser()
    if (!user) return []

    const calls = await prisma.call.findMany({
        where: {
            campaignId,
            campaign: {
                workspace: { userId: user.id },
            },
        },
        include: callInclude,
        orderBy: { calledAt: "desc" },
    })

    return calls.map((call) => serializeCallWithLead(call as CallWithLeadAndCampaign))
}

// ============================================
// CREATE CALL
// ============================================

export async function createCall(data: CreateCallInput): Promise<ActionResult<{ id: string }>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autenticado" }
        }

        const validation = createCallSchema.safeParse(data)
        if (!validation.success) {
            return { success: false, error: validation.error.issues[0].message }
        }

        const { leadId, workspaceId, result, duration, notes, followUpAt, calledAt, campaignId } = validation.data

        const hasAccess = await verifyWorkspaceAccess(workspaceId)
        if (!hasAccess) {
            return { success: false, error: "Acesso negado ao workspace" }
        }

        const lead = await prisma.lead.findFirst({
            where: { id: leadId, workspaceId },
        })

        if (!lead) {
            return { success: false, error: "Lead não encontrado" }
        }

        // Verificar se a campanha existe e pertence ao workspace (se informada)
        if (campaignId) {
            const campaign = await prisma.campaign.findFirst({
                where: { id: campaignId, workspaceId },
            })
            if (!campaign) {
                return { success: false, error: "Campanha não encontrada" }
            }
        }

        const call = await prisma.call.create({
            data: {
                leadId,
                workspaceId,
                result,
                duration: duration ?? null,
                notes: notes ?? null,
                followUpAt: followUpAt ?? null,
                calledAt: calledAt ?? new Date(),
                campaignId: campaignId ?? null,  // NOVO
            },
        })

        const newLeadStatus = getLeadStatusFromCallResult(result)
        if (newLeadStatus && lead.status !== newLeadStatus) {
            await prisma.lead.update({
                where: { id: leadId },
                data: { status: newLeadStatus },
            })
        }

        revalidatePath("/calls")
        revalidatePath("/leads")
        revalidatePath(`/leads/${leadId}`)
        if (campaignId) {
            revalidatePath(`/campaigns/${campaignId}`)
        }

        return { success: true, data: { id: call.id } }
    } catch (error) {
        console.error("[createCall] Error:", error)
        return { success: false, error: "Erro ao registrar ligação" }
    }
}

// ============================================
// UPDATE CALL
// ============================================

export async function updateCall(
    id: string,
    data: UpdateCallInput
): Promise<ActionResult<void>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autenticado" }
        }

        const validation = updateCallSchema.safeParse(data)
        if (!validation.success) {
            return { success: false, error: validation.error.issues[0].message }
        }

        const existingCall = await prisma.call.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
            include: { lead: true },
        })

        if (!existingCall) {
            return { success: false, error: "Ligação não encontrada" }
        }

        // Verificar se a campanha existe (se informada)
        if (validation.data.campaignId) {
            const campaign = await prisma.campaign.findFirst({
                where: { id: validation.data.campaignId, workspaceId: existingCall.workspaceId },
            })
            if (!campaign) {
                return { success: false, error: "Campanha não encontrada" }
            }
        }

        await prisma.call.update({
            where: { id },
            data: {
                ...validation.data,
                updatedAt: new Date(),
            },
        })

        if (validation.data.result && validation.data.result !== existingCall.result) {
            const newLeadStatus = getLeadStatusFromCallResult(validation.data.result)
            if (newLeadStatus) {
                await prisma.lead.update({
                    where: { id: existingCall.leadId },
                    data: { status: newLeadStatus },
                })
            }
        }

        revalidatePath("/calls")
        revalidatePath("/leads")
        revalidatePath(`/leads/${existingCall.leadId}`)
        if (existingCall.campaignId) {
            revalidatePath(`/campaigns/${existingCall.campaignId}`)
        }
        if (validation.data.campaignId) {
            revalidatePath(`/campaigns/${validation.data.campaignId}`)
        }

        return { success: true }
    } catch (error) {
        console.error("[updateCall] Error:", error)
        return { success: false, error: "Erro ao atualizar ligação" }
    }
}

// ============================================
// DELETE CALL
// ============================================

export async function deleteCall(id: string): Promise<ActionResult<void>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autenticado" }
        }

        const call = await prisma.call.findFirst({
            where: {
                id,
                workspace: { userId: user.id },
            },
        })

        if (!call) {
            return { success: false, error: "Ligação não encontrada" }
        }

        await prisma.call.delete({ where: { id } })

        revalidatePath("/calls")
        revalidatePath("/leads")
        revalidatePath(`/leads/${call.leadId}`)
        if (call.campaignId) {
            revalidatePath(`/campaigns/${call.campaignId}`)
        }

        return { success: true }
    } catch (error) {
        console.error("[deleteCall] Error:", error)
        return { success: false, error: "Erro ao excluir ligação" }
    }
}

// ============================================
// GET PENDING CALLBACKS
// ============================================

export async function getPendingCallbacks(
    workspaceId: string
): Promise<CallbacksSummary> {
    const hasAccess = await verifyWorkspaceAccess(workspaceId)
    if (!hasAccess) {
        return {
            overdue: [],
            today: [],
            thisWeek: [],
            later: [],
            overdueCount: 0,
            todayCount: 0,
            thisWeekCount: 0,
            laterCount: 0,
        }
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const weekEnd = new Date(todayStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const calls = await prisma.call.findMany({
        where: {
            workspaceId,
            followUpAt: { not: null },
        },
        include: callInclude,
        orderBy: { followUpAt: "asc" },
    })

    const summary: CallbacksSummary = {
        overdue: [],
        today: [],
        thisWeek: [],
        later: [],
        overdueCount: 0,
        todayCount: 0,
        thisWeekCount: 0,
        laterCount: 0,
    }

    calls.forEach((call) => {
        if (!call.followUpAt) return

        const followUpDate = new Date(call.followUpAt)
        const daysUntil = Math.ceil(
            (followUpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        const isOverdue = followUpDate < todayStart
        const isToday = followUpDate >= todayStart && followUpDate < todayEnd
        const isThisWeek = followUpDate >= todayEnd && followUpDate < weekEnd

        const pendingCallback: PendingCallback = {
            ...(call as CallWithLeadAndCampaign),
            isOverdue,
            isToday,
            isThisWeek,
            daysUntil,
        }

        if (isOverdue) {
            summary.overdue.push(pendingCallback)
        } else if (isToday) {
            summary.today.push(pendingCallback)
        } else if (isThisWeek) {
            summary.thisWeek.push(pendingCallback)
        } else {
            summary.later.push(pendingCallback)
        }
    })

    // Atualizar contadores
    summary.overdueCount = summary.overdue.length
    summary.todayCount = summary.today.length
    summary.thisWeekCount = summary.thisWeek.length
    summary.laterCount = summary.later.length

    return summary
}

// ============================================
// GET CALL STATS
// ============================================

export async function getCallStats(
    workspaceId: string,
    dateFrom?: Date,
    dateTo?: Date
): Promise<{
    total: number
    byResult: Record<CallResult, number>
    avgDuration: number
    pendingCallbacks: number
}> {
    const hasAccess = await verifyWorkspaceAccess(workspaceId)
    if (!hasAccess) {
        return {
            total: 0,
            byResult: {} as Record<CallResult, number>,
            avgDuration: 0,
            pendingCallbacks: 0,
        }
    }

    const where: any = { workspaceId }

    if (dateFrom || dateTo) {
        where.calledAt = {}
        if (dateFrom) where.calledAt.gte = dateFrom
        if (dateTo) where.calledAt.lte = dateTo
    }

    const calls = await prisma.call.findMany({
        where,
        select: {
            result: true,
            duration: true,
            followUpAt: true,
        },
    })

    const byResult = calls.reduce(
        (acc, call) => {
            acc[call.result] = (acc[call.result] || 0) + 1
            return acc
        },
        {} as Record<CallResult, number>
    )

    const callsWithDuration = calls.filter((c) => c.duration && c.duration > 0)
    const avgDuration =
        callsWithDuration.length > 0
            ? callsWithDuration.reduce((sum, c) => sum + (c.duration || 0), 0) /
            callsWithDuration.length
            : 0

    const now = new Date()
    const pendingCallbacks = calls.filter(
        (c) => c.followUpAt && new Date(c.followUpAt) >= now
    ).length

    return {
        total: calls.length,
        byResult,
        avgDuration: Math.round(avgDuration),
        pendingCallbacks,
    }
}

// ============================================
// GET CAMPAIGN CALL STATS (NOVO!)
// ============================================

export async function getCampaignCallStats(campaignId: string): Promise<{
    total: number
    byResult: Record<CallResult, number>
    interested: number
    meetingsScheduled: number
}> {
    const user = await getAuthenticatedUser()
    if (!user) {
        return {
            total: 0,
            byResult: {} as Record<CallResult, number>,
            interested: 0,
            meetingsScheduled: 0,
        }
    }

    const calls = await prisma.call.findMany({
        where: {
            campaignId,
            campaign: {
                workspace: { userId: user.id },
            },
        },
        select: {
            result: true,
        },
    })

    const byResult = calls.reduce(
        (acc, call) => {
            acc[call.result] = (acc[call.result] || 0) + 1
            return acc
        },
        {} as Record<CallResult, number>
    )

    return {
        total: calls.length,
        byResult,
        interested: byResult.INTERESTED || 0,
        meetingsScheduled: byResult.MEETING_SCHEDULED || 0,
    }
}