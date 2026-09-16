import "server-only"

import { prisma } from "@/lib/prisma"
import { decryptSecret } from "@/lib/secrets"

const TOKEN_URL = "https://oauth2.googleapis.com/token"
const SEARCH_CONSOLE_URL = "https://www.googleapis.com/webmasters/v3"

export type SearchConsoleRow = {
    label: string
    clicks: number
    impressions: number
    ctr: number
    position: number
}

export type GoogleSearchConsoleData = {
    status: "ready" | "not_connected" | "not_configured" | "error"
    siteUrl?: string
    clicks: number
    impressions: number
    ctr: number
    position: number
    daily: Array<SearchConsoleRow & { date: string }>
    queries: SearchConsoleRow[]
    pages: SearchConsoleRow[]
    countries: SearchConsoleRow[]
    devices: SearchConsoleRow[]
}

type SearchConsoleApiRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }
type SearchConsoleResponse = { rows?: SearchConsoleApiRow[] }

function number(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : 0 }
function empty(status: GoogleSearchConsoleData["status"]): GoogleSearchConsoleData {
    return { status, clicks: 0, impressions: 0, ctr: 0, position: 0, daily: [], queries: [], pages: [], countries: [], devices: [] }
}

function isoDate(date: Date) { return date.toISOString().slice(0, 10) }
function daysBefore(date: Date, days: number) {
    const result = new Date(date)
    result.setUTCDate(result.getUTCDate() - days)
    return result
}

async function accessToken(refreshToken: string) {
    const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET
    if (!clientId || !clientSecret) throw new Error("Google Search Console OAuth não configurado")

    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
        signal: AbortSignal.timeout(8_000),
    })
    if (!response.ok) throw new Error(`Google OAuth respondeu ${response.status}`)
    const payload = await response.json() as { access_token?: string }
    if (!payload.access_token) throw new Error("Google OAuth não retornou access token")
    return payload.access_token
}

async function query(accessTokenValue: string, siteUrl: string, startDate: string, endDate: string, dimensions: string[]) {
    const response = await fetch(`${SEARCH_CONSOLE_URL}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessTokenValue}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 100 }),
        signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error(`Search Console respondeu ${response.status}`)
    return (await response.json() as SearchConsoleResponse).rows || []
}

function row(item: SearchConsoleApiRow): SearchConsoleRow {
    return { label: item.keys?.[0] || "Não identificado", clicks: number(item.clicks), impressions: number(item.impressions), ctr: number(item.ctr), position: number(item.position) }
}

export async function getGoogleSearchConsoleAnalytics(userId: string, days = 28): Promise<GoogleSearchConsoleData> {
    if (!process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || !process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET) return empty("not_configured")
    const connection = await prisma.googleSearchConsoleConnection.findUnique({ where: { userId } })
    if (!connection) return empty("not_connected")

    try {
        const token = await accessToken(decryptSecret(connection.refreshTokenEncrypted) || "")
        // O Search Console consolida dados com atraso; usar ontem evita misturar
        // o dia parcial com dias fechados.
        const endDate = isoDate(daysBefore(new Date(), 1))
        const startDate = isoDate(daysBefore(new Date(), days))
        const [daily, queries, pages, countries, devices] = await Promise.all([
            query(token, connection.siteUrl, startDate, endDate, ["date"]),
            query(token, connection.siteUrl, startDate, endDate, ["query"]),
            query(token, connection.siteUrl, startDate, endDate, ["page"]),
            query(token, connection.siteUrl, startDate, endDate, ["country"]),
            query(token, connection.siteUrl, startDate, endDate, ["device"]),
        ])
        const dailyRows = daily.map((item) => ({ ...row(item), date: item.keys?.[0] || "" }))
        const clicks = dailyRows.reduce((sum, item) => sum + item.clicks, 0)
        const impressions = dailyRows.reduce((sum, item) => sum + item.impressions, 0)
        return {
            status: "ready", siteUrl: connection.siteUrl, clicks, impressions,
            ctr: impressions ? clicks / impressions : 0,
            position: impressions ? dailyRows.reduce((sum, item) => sum + item.position * item.impressions, 0) / impressions : 0,
            daily: dailyRows,
            queries: queries.map(row), pages: pages.map(row), countries: countries.map(row), devices: devices.map(row),
        }
    } catch (error) {
        console.error("[google-search-console] Falha ao consultar métricas:", error)
        return empty("error")
    }
}
