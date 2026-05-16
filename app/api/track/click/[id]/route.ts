// app/api/track/click/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    canUpgradeStatus,
    getTrackingBaseUrl,
    TRACKING_LEAD_STATUS_MAP,
} from '@/lib/constants/tracking.constants'
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const rateLimiter = rateLimit(1000)

// ============================================
// TYPES
// ============================================

interface RouteParams {
    params: Promise<{ id: string }>
}

function getSafeRedirectUrl(originalUrl: string | null): string {
    const baseUrl = getTrackingBaseUrl()
    if (!originalUrl) {
        return baseUrl
    }

    try {
        const parsedUrl = new URL(originalUrl)
        const allowedHosts = [
            new URL(baseUrl).hostname,
            "localhost",
        ]

        if (
            (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') &&
            allowedHosts.includes(parsedUrl.hostname)
        ) {
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
    const redirectUrl = getSafeRedirectUrl(originalUrl)

    console.log(`[Tracking] Processing click for: ${emailSendId} → ${originalUrl}`)

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
            console.log(`[Tracking] EmailSend not found: ${emailSendId}`)
            return NextResponse.redirect(redirectUrl)
        }

        console.log(`[Tracking] Current state - openedAt: ${emailSend.openedAt}, clickedAt: ${emailSend.clickedAt}`)

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
        console.log(`[Tracking] Updated EmailSend - clickedAt and status`)

        // Update lead status if applicable
        if (shouldUpgradeLeadStatus) {
            await prisma.lead.update({
                where: { id: emailSend.leadId },
                data: { status: TRACKING_LEAD_STATUS_MAP.click },
            })
            console.log(`[Tracking] Updated Lead status to CLICKED`)
        }

        // Update campaign counters
        if (emailSend.campaignId) {
            // Increment clicked counter (only on first click)
            if (isFirstClick) {
                await prisma.campaign.update({
                    where: { id: emailSend.campaignId },
                    data: { totalClicked: { increment: 1 } },
                })
                console.log(`[Tracking] Incremented Campaign totalClicked`)
            }

            // Also increment opened if this is first interaction
            if (isFirstOpen) {
                await prisma.campaign.update({
                    where: { id: emailSend.campaignId },
                    data: { totalOpened: { increment: 1 } },
                })
                console.log(`[Tracking] Incremented Campaign totalOpened (via click)`)
            }
        }

        console.log(`[Tracking] ✅ Link clicked: ${emailSendId} → ${originalUrl}`)

        return NextResponse.redirect(redirectUrl)

    } catch (error) {
        console.error('[Tracking] Error recording click:', error)
        return NextResponse.redirect(redirectUrl)
    }
}
