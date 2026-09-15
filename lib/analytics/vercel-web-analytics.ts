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
    allCountries: VercelAnalyticsRow[]
    filterOptions: {
        pages: string[]
        countries: string[]
        devices: string[]
        referrers: string[]
    }
}

export type VercelAnalyticsFilters = {
    days: 7 | 30 | 90
    path?: string
    country?: string
    device?: string
    referrer?: string
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
        allCountries: [],
        filterOptions: { pages: [], countries: [], devices: [], referrers: [] },
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
    limit?: number,
    filter?: string
): Promise<ApiRow[]> {
    const url = new URL(API_URL)
    url.searchParams.set("projectId", projectId)
    url.searchParams.set("teamId", teamId)
    url.searchParams.set("since", since)
    url.searchParams.set("until", until)
    url.searchParams.set("by", by)
    if (limit) url.searchParams.set("limit", String(limit))
    if (filter) url.searchParams.set("filter", filter)

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
    })).filter((row) => row.label.toLocaleLowerCase() !== "others")
}

function escapeFilterValue(value: string) {
    return value.replaceAll("'", "''")
}

function buildFilter(filters: VercelAnalyticsFilters) {
    const parts: string[] = []
    if (filters.path) parts.push(`requestPath eq '${escapeFilterValue(filters.path)}'`)
    if (filters.country) parts.push(`country eq '${escapeFilterValue(filters.country)}'`)
    if (filters.device) parts.push(`deviceType eq '${escapeFilterValue(filters.device)}'`)
    if (filters.referrer) parts.push(`referrerHostname eq '${escapeFilterValue(filters.referrer)}'`)
    return parts.join(" and ")
}

const getCachedVercelWebAnalytics = unstable_cache(
    async (filters: VercelAnalyticsFilters): Promise<VercelWebAnalyticsData> => {
        const token = process.env.VERCEL_ANALYTICS_TOKEN
        const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID || process.env.VERCEL_PROJECT_ID
        const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID

        if (!token || !projectId || !teamId) return { ...emptyData("not_configured"), periodDays: filters.days }

        const untilDate = new Date()
        const sinceDate = new Date(untilDate)
        sinceDate.setUTCDate(sinceDate.getUTCDate() - (filters.days - 1))
        const since = dateOnly(sinceDate)
        const until = dateOnly(untilDate)

        try {
            const activeFilter = buildFilter(filters)
            const [dailyRows, pageRows, countryRows, referrerRows, deviceRows, allPages, allCountries, allDevices, allReferrers] = await Promise.all([
                queryAggregate(token, projectId, teamId, since, until, "day", undefined, activeFilter),
                queryAggregate(token, projectId, teamId, since, until, "requestPath", 10, activeFilter),
                queryAggregate(token, projectId, teamId, since, until, "country", 250, activeFilter),
                queryAggregate(token, projectId, teamId, since, until, "referrerHostname", 10, activeFilter),
                queryAggregate(token, projectId, teamId, since, until, "deviceType", 10, activeFilter),
                queryAggregate(token, projectId, teamId, since, until, "requestPath", 250),
                queryAggregate(token, projectId, teamId, since, until, "country", 250),
                queryAggregate(token, projectId, teamId, since, until, "deviceType", 50),
                queryAggregate(token, projectId, teamId, since, until, "referrerHostname", 250),
            ])

            const daily = dailyRows.map((row) => ({
                label: typeof row.timestamp === "string" ? row.timestamp.slice(0, 10) : "",
                timestamp: typeof row.timestamp === "string" ? row.timestamp : "",
                pageviews: numberValue(row.pageviews),
                visitors: numberValue(row.visitors),
            }))

            return {
                status: "ready",
                periodDays: filters.days,
                pageviews: daily.reduce((sum, row) => sum + row.pageviews, 0),
                visitors: daily.reduce((sum, row) => sum + row.visitors, 0),
                daily,
                topPages: dimensionRows(pageRows, "requestPath"),
                countries: dimensionRows(countryRows, "country").slice(0, 6),
                referrers: dimensionRows(referrerRows, "referrerHostname"),
                devices: dimensionRows(deviceRows, "deviceType"),
                allCountries: dimensionRows(countryRows, "country"),
                filterOptions: {
                    pages: dimensionRows(allPages, "requestPath").map((row) => row.label),
                    countries: dimensionRows(allCountries, "country").map((row) => row.label),
                    devices: dimensionRows(allDevices, "deviceType").map((row) => row.label),
                    referrers: dimensionRows(allReferrers, "referrerHostname").map((row) => row.label),
                },
            }
        } catch (error) {
            console.error("[vercel-analytics] Falha ao consultar métricas:", error)
            return { ...emptyData("error"), periodDays: filters.days }
        }
    },
    ["vercel-web-analytics-filtered-v2"],
    { revalidate: 900 }
)

export async function getVercelWebAnalytics(filters: VercelAnalyticsFilters = { days: 30 }) {
    return getCachedVercelWebAnalytics(filters)
}
