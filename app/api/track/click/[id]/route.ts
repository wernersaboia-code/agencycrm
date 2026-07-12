// app/api/track/click/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    canUpgradeStatus,
    getTrackingBaseUrl,
    TRACKING_LEAD_STATUS_MAP,
} from '@/lib/constants/tracking.constants'
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { verifySignature } from "@/lib/signing"

const rateLimiter = rateLimit(1000)

// ============================================
// TYPES
// ============================================

interface RouteParams {
    params: Promise<{ id: string }>
}

function getSafeRedirectUrl(originalUrl: string | null, signature: string | null): string {
    const baseUrl = getTrackingBaseUrl()
    if (!originalUrl) {
        return baseUrl
    }

    // A URL de destino precisa ter sido assinada por este app (o wrapper de
    // tracking assina toda URL de clique). Isso libera links externos legítimos
    // sem permitir open redirect a partir de parâmetros arbitrários.
    if (!verifySignature(originalUrl, signature)) {
        return baseUrl
    }

    try {
        const parsedUrl = new URL(originalUrl)
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
            return parsedUrl.toString()
        }
    } catch {
        return baseUrl
    }

    return baseUrl
}

// ============================================
// GET /api/track/click/[id]?url=xxx
// ============================================

export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        await rateLimiter.check(getClientIp(request), 60, 60_000) // 60 clicks per minute
    } catch {
        return NextResponse.redirect(getTrackingBaseUrl())
    }

    const { id: emailSendId } = await params
    const { searchParams } = new URL(request.url)
    const originalUrl = searchParams.get('url')
    const signature = searchParams.get('sig')
    const redirectUrl = getSafeRedirectUrl(originalUrl, signature)

    try {
        // Fetch current email send status
        const emailSend = await prisma.emailSend.findUnique({
            where: { id: emailSendId },
            select: {
                id: true,
                status: true,
                openedAt: true,
                clickedAt: true,
                leadId: true,
                campaignId: true,
                lead: {
                    select: {
                        status: true,
                    },
                },
            },
        })

        if (!emailSend) {
            return NextResponse.redirect(redirectUrl)
        }

        const now = new Date()
        const isFirstClick = !emailSend.clickedAt
        const isFirstOpen = !emailSend.openedAt

        const shouldUpgradeEmailStatus = canUpgradeStatus(emailSend.status, 'CLICKED')
        const shouldUpgradeLeadStatus = canUpgradeStatus(
            emailSend.lead.status,
            TRACKING_LEAD_STATUS_MAP.click
        )

        // Update email send
        // NOTE: If clicked, it means it was also opened
        await prisma.emailSend.update({
            where: { id: emailSendId },
            data: {
                clickedAt: emailSend.clickedAt || now,
                openedAt: emailSend.openedAt || now,
                ...(shouldUpgradeEmailStatus && { status: 'CLICKED' }),
            },
        })

        // Update lead status if applicable
        if (shouldUpgradeLeadStatus) {
            await prisma.lead.update({
                where: { id: emailSend.leadId },
                data: { status: TRACKING_LEAD_STATUS_MAP.click },
            })
        }

        // Update campaign counters
        if (emailSend.campaignId) {
            // Increment clicked counter (only on first click)
            if (isFirstClick) {
                await prisma.campaign.update({
                    where: { id: emailSend.campaignId },
                    data: { totalClicked: { increment: 1 } },
                })
            }

            // Also increment opened if this is first interaction
            if (isFirstOpen) {
                await prisma.campaign.update({
                    where: { id: emailSend.campaignId },
                    data: { totalOpened: { increment: 1 } },
                })
            }
        }

        return NextResponse.redirect(redirectUrl)

    } catch (error) {
        console.error('[Tracking] Error recording click:', error)
        return NextResponse.redirect(redirectUrl)
    }
}
