// actions/campaigns/metrics.ts

"use server"

import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// ============================================
// TYPES
// ============================================

interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

interface RecalculatedMetrics {
    totalSent: number
    totalOpened: number
    totalClicked: number
    totalBounced: number
}

export interface EmailSendDetails {
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

// ============================================
// RECALCULATE CAMPAIGN METRICS
// ============================================

export async function recalculateCampaignMetrics(
    campaignId: string
): Promise<ActionResult<RecalculatedMetrics>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        // Verify campaign belongs to user
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaignId,
                workspace: { userId: user.id },
            },
        })

        if (!campaign) {
            return { success: false, error: "Campanha não encontrada" }
        }

        // Count metrics from EmailSends
        const [totalSent, totalOpened, totalClicked, totalBounced] = await Promise.all([
            // Sent = not PENDING
            prisma.emailSend.count({
                where: {
                    campaignId,
                    status: { not: 'PENDING' },
                },
            }),
            // Opened = has openedAt
            prisma.emailSend.count({
                where: {
                    campaignId,
                    openedAt: { not: null },
                },
            }),
            // Clicked = has clickedAt
            prisma.emailSend.count({
                where: {
                    campaignId,
                    clickedAt: { not: null },
                },
            }),
            // Bounced = status BOUNCED
            prisma.emailSend.count({
                where: {
                    campaignId,
                    status: 'BOUNCED',
                },
            }),
        ])

        // Update campaign with recalculated metrics
        await prisma.campaign.update({
            where: { id: campaignId },
            data: {
                totalSent,
                totalOpened,
                totalClicked,
                totalBounced,
            },
        })

        console.log(`[Metrics] Recalculated for campaign ${campaignId}:`, {
            totalSent,
            totalOpened,
            totalClicked,
            totalBounced,
        })

        revalidatePath(`/campaigns/${campaignId}`)
        revalidatePath('/campaigns')

        return {
            success: true,
            data: { totalSent, totalOpened, totalClicked, totalBounced },
        }
    } catch (error) {
        console.error("Erro ao recalcular métricas:", error)
        return { success: false, error: "Erro ao recalcular métricas" }
    }
}

// ============================================
// RECALCULATE ALL CAMPAIGNS
// ============================================

export async function recalculateAllCampaignsMetrics(): Promise<ActionResult<number>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const campaigns = await prisma.campaign.findMany({
            where: {
                workspace: { userId: user.id },
            },
            select: { id: true },
        })

        let count = 0
        for (const campaign of campaigns) {
            const result = await recalculateCampaignMetrics(campaign.id)
            if (result.success) count++
        }

        revalidatePath('/campaigns')

        return { success: true, data: count }
    } catch (error) {
        console.error("Erro ao recalcular todas as métricas:", error)
        return { success: false, error: "Erro ao recalcular métricas" }
    }
}

// ============================================
// GET CAMPAIGN EMAIL SENDS
// ============================================

export async function getCampaignEmailSends(
    campaignId: string
): Promise<ActionResult<EmailSendDetails[]>> {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return { success: false, error: "Não autorizado" }
        }

        const emailSends = await prisma.emailSend.findMany({
            where: {
                campaignId,
                campaign: {
                    workspace: { userId: user.id },
                },
            },
            include: {
                lead: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        company: true,
                    },
                },
            },
            orderBy: [
                { openedAt: 'desc' },
                { sentAt: 'desc' },
            ],
        })

        // Serialize dates
        const serialized: EmailSendDetails[] = emailSends.map((send) => ({
            id: send.id,
            status: send.status,
            sentAt: send.sentAt?.toISOString() || null,
            openedAt: send.openedAt?.toISOString() || null,
            clickedAt: send.clickedAt?.toISOString() || null,
            repliedAt: send.repliedAt?.toISOString() || null,
            bouncedAt: send.bouncedAt?.toISOString() || null,
            bounceReason: send.bounceReason,
            lead: send.lead,
        }))

        return { success: true, data: serialized }
    } catch (error) {
        console.error("Erro ao buscar envios:", error)
        return { success: false, error: "Erro ao buscar envios" }
    }
}