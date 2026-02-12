// types/tracking.types.ts

// ============================================
// TRACKING TYPES
// ============================================

export interface TrackingPixelParams {
    emailSendId: string
    campaignId: string
    leadId: string
}

export interface TrackingClickParams extends TrackingPixelParams {
    originalUrl: string
}

export interface TrackingResult {
    success: boolean
    emailSendId: string
    action: 'open' | 'click'
    timestamp: Date
}

export interface EmailTrackingMetrics {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    openRate: number
    clickRate: number
    clickToOpenRate: number
}

export interface EmailSendWithTracking {
    id: string
    status: string
    sentAt: Date | string | null
    openedAt: Date | string | null
    clickedAt: Date | string | null
    bounceReason?: string | null
    lead: {
        id: string
        firstName: string | null
        lastName: string | null
        email: string
    }
}