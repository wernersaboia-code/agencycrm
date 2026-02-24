// lib/constants/tracking.constants.ts

// ============================================
// TRACKING CONSTANTS
// ============================================

/**
 * Get base URL for tracking endpoints
 * NOTE: Function instead of constant to ensure env var is read at runtime
 */
export function getTrackingBaseUrl(): string {
    // Em produção, usa a variável de ambiente
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL
    }

    // Em desenvolvimento, usa localhost com a porta correta
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:3001'
    }

    // Fallback
    return 'http://localhost:3001'
}

// Manter compatibilidade com código existente
export const TRACKING_BASE_URL = getTrackingBaseUrl()

/**
 * Tracking endpoint paths
 */
export const TRACKING_ENDPOINTS = {
    open: '/api/track/open',
    click: '/api/track/click',
} as const

/**
 * 1x1 transparent GIF pixel (base64)
 */
export const TRANSPARENT_PIXEL_BASE64 =
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/**
 * Transparent pixel as Buffer for API response
 */
export const TRANSPARENT_PIXEL_BUFFER = Buffer.from(
    TRANSPARENT_PIXEL_BASE64,
    'base64'
)

/**
 * Response headers for tracking pixel
 */
export const PIXEL_RESPONSE_HEADERS: Record<string, string> = {
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
}

/**
 * Status priority for updates
 */
export const EMAIL_STATUS_PRIORITY: Record<string, number> = {
    PENDING: 0,
    SENT: 1,
    DELIVERED: 2,
    OPENED: 3,
    CLICKED: 4,
    REPLIED: 5,
    BOUNCED: 1,
    COMPLAINED: 1,
}

/**
 * Check if status can be upgraded
 */
export function canUpgradeStatus(
    currentStatus: string,
    newStatus: string
): boolean {
    const currentPriority = EMAIL_STATUS_PRIORITY[currentStatus] ?? 0
    const newPriority = EMAIL_STATUS_PRIORITY[newStatus] ?? 0
    return newPriority > currentPriority
}

/**
 * Lead status mapping for tracking events
 */
export const TRACKING_LEAD_STATUS_MAP = {
    open: 'OPENED',
    click: 'CLICKED',
} as const