// types/tracking.types.ts
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

export interface TrackingPixelData {
    campaignId: string
    leadId: string
    emailSendId: string
}

export interface TrackingLinkData extends TrackingPixelData {
    originalUrl: string
}

export interface TrackingEvent {
    type: "open" | "click"
    emailSendId: string
    campaignId: string
    leadId: string
    timestamp: Date
    metadata?: {
        url?: string
        userAgent?: string
        ip?: string
    }
}