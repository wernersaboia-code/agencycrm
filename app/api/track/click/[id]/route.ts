// app/api/track/click/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
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
// GET /api/track/click/[id]?url=xxx
// Records click and redirects to original URL
// ============================================

export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    const { id: emailSendId } = await params
    const { searchParams } = new URL(request.url)
    const originalUrl = searchParams.get('url')

    // Fallback URL if none provided
    const redirectUrl = originalUrl
        ? decodeURIComponent(originalUrl)
        : '/'

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

        const now = new Date()
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

        console.log(`[Tracking] ✅ Link clicked: ${emailSendId} → ${originalUrl}`)

        return NextResponse.redirect(redirectUrl)

    } catch (error) {
        console.error('[Tracking] Error recording click:', error)
        return NextResponse.redirect(redirectUrl)
    }
}