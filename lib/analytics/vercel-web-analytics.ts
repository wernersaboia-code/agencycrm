import "server-only"

import { unstable_cache } from "next/cache"

const API_URL = "https://api.vercel.com/v1/query/web-analytics/visits/aggregate"

export type VercelAnalyticsRow = {
    label: string
    pageviews: number
    visitors: number
}

export type VercelWebAnalyticsData = {
    status: "ready" | "not_configured" | "error"
    periodDays: number
    pageviews: number
    visitors: number
    daily: Array<VercelAnalyticsRow & { timestamp: string }>
    topPages: VercelAnalyticsRow[]
    countries: VercelAnalyticsRow[]
    referrers: VercelAnalyticsRow[]
    devices: VercelAnalyticsRow[]
}

type ApiRow = Record<string, unknown> & {
    pageviews?: unknown
    visitors?: unknown
    timestamp?: unknown
}

type ApiResponse = { data?: ApiRow[] }

function emptyData(status: VercelWebAnalyticsData["status"]): VercelWebAnalyticsData {
    return {
        status,
        periodDays: 30,
        pageviews: 0,
        visitors: 0,
        daily: [],
        topPages: [],
        countries: [],
        referrers: [],
        devices: [],
    }
}

function dateOnly(date: Date) {
    return date.toISOString().slice(0, 10)
}

function numberValue(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : 0
}

async function queryAggregate(
    token: string,
    projectId: string,
    teamId: string,
    since: string,
    until: string,
    by: string,
    limit?: number
): Promise<ApiRow[]> {
    const url = new URL(API_URL)
    url.searchParams.set("projectId", projectId)
    url.searchParams.set("teamId", teamId)
    url.searchParams.set("since", since)
    url.searchParams.set("until", until)
    url.searchParams.set("by", by)
    if (limit) url.searchParams.set("limit", String(limit))

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8_000),
    })

    if (!response.ok) {
        throw new Error(`Vercel Web Analytics respondeu ${response.status}`)
    }

    const payload = await response.json() as ApiResponse
    return Array.isArray(payload.data) ? payload.data : []
}

function dimensionRows(rows: ApiRow[], dimension: string): VercelAnalyticsRow[] {
    return rows.map((row) => ({
        label: typeof row[dimension] === "string" && row[dimension] ? String(row[dimension]) : "—",
        pageviews: numberValue(row.pageviews),
        visitors: numberValue(row.visitors),
    }))
}

const getCachedVercelWebAnalytics = unstable_cache(
    async (): Promise<VercelWebAnalyticsData> => {
        const token = process.env.VERCEL_ANALYTICS_TOKEN
        const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID || process.env.VERCEL_PROJECT_ID
        const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID

        if (!token || !projectId || !teamId) return emptyData("not_configured")

        const untilDate = new Date()
        const sinceDate = new Date(untilDate)
        sinceDate.setUTCDate(sinceDate.getUTCDate() - 29)
        const since = dateOnly(sinceDate)
        const until = dateOnly(untilDate)

        try {
            const [dailyRows, pageRows, countryRows, referrerRows, deviceRows] = await Promise.all([
                queryAggregate(token, projectId, teamId, since, until, "day"),
                queryAggregate(token, projectId, teamId, since, until, "requestPath", 8),
                queryAggregate(token, projectId, teamId, since, until, "country", 6),
                queryAggregate(token, projectId, teamId, since, until, "referrerHostname", 6),
                queryAggregate(token, projectId, teamId, since, until, "deviceType", 5),
            ])

            const daily = dailyRows.map((row) => ({
                label: typeof row.timestamp === "string" ? row.timestamp.slice(0, 10) : "",
                timestamp: typeof row.timestamp === "string" ? row.timestamp : "",
                pageviews: numberValue(row.pageviews),
                visitors: numberValue(row.visitors),
            }))

            return {
                status: "ready",
                periodDays: 30,
                pageviews: daily.reduce((sum, row) => sum + row.pageviews, 0),
                visitors: daily.reduce((sum, row) => sum + row.visitors, 0),
                daily,
                topPages: dimensionRows(pageRows, "requestPath"),
                countries: dimensionRows(countryRows, "country"),
                referrers: dimensionRows(referrerRows, "referrerHostname"),
                devices: dimensionRows(deviceRows, "deviceType"),
            }
        } catch (error) {
            console.error("[vercel-analytics] Falha ao consultar métricas:", error)
            return emptyData("error")
        }
    },
    ["vercel-web-analytics-30d-v1"],
    { revalidate: 900 }
)

export async function getVercelWebAnalytics() {
    return getCachedVercelWebAnalytics()
}
