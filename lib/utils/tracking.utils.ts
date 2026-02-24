// lib/utils/tracking.utils.ts

import {
    getTrackingBaseUrl,
    TRACKING_ENDPOINTS
} from '@/lib/constants/tracking.constants'
import type { EmailTrackingMetrics } from '@/types/tracking.types'

// ============================================
// TYPES
// ============================================

interface GenerateTrackingUrlParams {
    emailSendId: string
    type: 'open' | 'click'
    originalUrl?: string
}

interface TrackingUrls {
    pixelUrl: string
    wrapUrl: (originalUrl: string) => string
}

// ============================================
// URL GENERATORS
// ============================================

/**
 * Generate tracking URL for open pixel or click redirect
 */
export function generateTrackingUrl({
                                        emailSendId,
                                        type,
                                        originalUrl
                                    }: GenerateTrackingUrlParams): string {
    const trackingBaseUrl = getTrackingBaseUrl()
    console.log('[Tracking] Base URL:', trackingBaseUrl) // Debug temporário

    const baseUrl = `${trackingBaseUrl}${TRACKING_ENDPOINTS[type]}/${emailSendId}`

    if (type === 'click' && originalUrl) {
        const encodedUrl = encodeURIComponent(originalUrl)
        return `${baseUrl}?url=${encodedUrl}`
    }

    return baseUrl
}

/**
 * Generate all tracking URLs for an email
 */
export function generateTrackingUrls(emailSendId: string): TrackingUrls {
    return {
        pixelUrl: generateTrackingUrl({ emailSendId, type: 'open' }),
        wrapUrl: (originalUrl: string): string => generateTrackingUrl({
            emailSendId,
            type: 'click',
            originalUrl
        }),
    }
}

// ============================================
// HTML INJECTION
// ============================================

/**
 * Generate tracking pixel HTML
 */
export function generateTrackingPixelHtml(emailSendId: string): string {
    const pixelUrl = generateTrackingUrl({ emailSendId, type: 'open' })
    return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`
}

/**
 * Wrap all links in HTML with tracking URLs
 */
export function wrapLinksWithTracking(
    html: string,
    emailSendId: string
): string {
    const { wrapUrl } = generateTrackingUrls(emailSendId)

    // Regex to find href attributes in anchor tags
    const linkRegex = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi

    return html.replace(
        linkRegex,
        (match: string, before: string, url: string, after: string): string => {
            // Skip tracking URLs (avoid double-wrapping)
            if (url.includes('/api/track/')) {
                return match
            }

            // Skip mailto and tel links
            if (url.startsWith('mailto:') || url.startsWith('tel:')) {
                return match
            }

            // Skip anchor links
            if (url.startsWith('#')) {
                return match
            }

            const trackedUrl = wrapUrl(url)
            return `<a ${before}href="${trackedUrl}"${after}>`
        }
    )
}

/**
 * Inject tracking into email HTML
 * - Wraps all links with click tracking
 * - Adds open tracking pixel at the end
 */
export function injectTrackingIntoEmail(
    html: string,
    emailSendId: string
): string {
    // Wrap links with tracking
    let trackedHtml = wrapLinksWithTracking(html, emailSendId)

    // Add tracking pixel before closing body tag or at the end
    const trackingPixel = generateTrackingPixelHtml(emailSendId)

    if (trackedHtml.includes('</body>')) {
        trackedHtml = trackedHtml.replace('</body>', `${trackingPixel}</body>`)
    } else {
        trackedHtml = `${trackedHtml}${trackingPixel}`
    }

    return trackedHtml
}

// ============================================
// METRICS CALCULATION
// ============================================

interface EmailSendForMetrics {
    status: string
    openedAt: Date | string | null
    clickedAt: Date | string | null
}

/**
 * Calculate tracking metrics from email sends
 */
export function calculateTrackingMetrics(
    emailSends: EmailSendForMetrics[]
): EmailTrackingMetrics {
    const sent = emailSends.filter(
        (send: EmailSendForMetrics): boolean => send.status !== 'PENDING'
    ).length

    const delivered = emailSends.filter(
        (send: EmailSendForMetrics): boolean =>
            !['PENDING', 'BOUNCED', 'COMPLAINED'].includes(send.status)
    ).length

    const opened = emailSends.filter(
        (send: EmailSendForMetrics): boolean => send.openedAt !== null
    ).length

    const clicked = emailSends.filter(
        (send: EmailSendForMetrics): boolean => send.clickedAt !== null
    ).length

    const bounced = emailSends.filter(
        (send: EmailSendForMetrics): boolean => send.status === 'BOUNCED'
    ).length

    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0
    const clickToOpenRate = opened > 0 ? (clicked / opened) * 100 : 0

    return {
        sent,
        delivered,
        opened,
        clicked,
        bounced,
        openRate: Math.round(openRate * 10) / 10,
        clickRate: Math.round(clickRate * 10) / 10,
        clickToOpenRate: Math.round(clickToOpenRate * 10) / 10,
    }
}