// app/api/track/open/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    TRANSPARENT_PIXEL_BUFFER,
    PIXEL_RESPONSE_HEADERS,
    canUpgradeStatus,
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

// ============================================
// HELPER
// ============================================

function createPixelResponse(): NextResponse {
    return new NextResponse(TRANSPARENT_PIXEL_BUFFER, {
        status: 200,
        headers: PIXEL_RESPONSE_HEADERS,
    })
}

// ============================================
// GET /api/track/open/[id]
// ============================================

export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        await rateLimiter.check(getClientIp(request), 100, 60_000) // 100 requests per minute
    } catch {
        return createPixelResponse()
    }

    const { id: emailSendId } = await params

    console.log(`[Tracking] Processing open for: ${emailSendId}`)

    try {
        // Fetch current email send status
        const emailSend = await prisma.emailSend.findUnique({
            where: { id: emailSendId },
            select: {
                id: true,
                status: true,
                openedAt: true,
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
            return createPixelResponse()
        }

        console.log(`[Tracking] Current state - openedAt: ${emailSend.openedAt}, status: ${emailSend.status}`)

        // Only update if not already opened
        if (!emailSend.openedAt) {
            const shouldUpgradeEmailStatus = canUpgradeStatus(emailSend.status, 'OPENED')
            const shouldUpgradeLeadStatus = canUpgradeStatus(
                emailSend.lead.status,
                TRACKING_LEAD_STATUS_MAP.open
            )

            // Update email send
            await prisma.emailSend.update({
                where: { id: emailSendId },
                data: {
                    openedAt: new Date(),
                    ...(shouldUpgradeEmailStatus && { status: 'OPENED' }),
                },
            })
            console.log(`[Tracking] Updated EmailSend status to OPENED`)

            // Update lead status if applicable
            if (shouldUpgradeLeadStatus) {
                await prisma.lead.update({
                    where: { id: emailSend.leadId },
                    data: { status: TRACKING_LEAD_STATUS_MAP.open },
                })
                console.log(`[Tracking] Updated Lead status to OPENED`)
            }

            // Increment campaign totalOpened counter
            if (emailSend.campaignId) {
                await prisma.campaign.update({
                    where: { id: emailSend.campaignId },
                    data: { totalOpened: { increment: 1 } },
                })
                console.log(`[Tracking] Incremented Campaign totalOpened`)
            }

            console.log(`[Tracking] ✅ Email opened: ${emailSendId}`)
        } else {
            console.log(`[Tracking] Email already opened, skipping update`)
        }

        return createPixelResponse()

    } catch (error) {
        console.error('[Tracking] Error recording open:', error)
        return createPixelResponse()
    }
}