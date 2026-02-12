// app/api/track/open/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    TRANSPARENT_PIXEL_BUFFER,
    PIXEL_RESPONSE_HEADERS,
    canUpgradeStatus,
    TRACKING_LEAD_STATUS_MAP,
} from '@/lib/constants/tracking.constants'

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
// Records email open and returns tracking pixel
// ============================================

export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    const { id: emailSendId } = await params

    try {
        // Fetch current email send status
        const emailSend = await prisma.emailSend.findUnique({
            where: { id: emailSendId },
            select: {
                id: true,
                status: true,
                openedAt: true,
                leadId: true,
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

            // Update lead status if applicable
            if (shouldUpgradeLeadStatus) {
                await prisma.lead.update({
                    where: { id: emailSend.leadId },
                    data: { status: TRACKING_LEAD_STATUS_MAP.open },
                })
            }

            console.log(`[Tracking] ✅ Email opened: ${emailSendId}`)
        }

        return createPixelResponse()

    } catch (error) {
        console.error('[Tracking] Error recording open:', error)
        return createPixelResponse()
    }
}