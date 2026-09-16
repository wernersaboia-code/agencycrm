import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encryptSecret } from "@/lib/secrets"

const CALLBACK_PATH = "/api/google-search-console/callback"
const STATE_COOKIE = "gsc_oauth_state"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const SITES_URL = "https://www.googleapis.com/webmasters/v3/sites"
function appUrl() { return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001").replace(/\/$/, "") }

function preferredSite(entries: Array<{ siteUrl?: string }> | undefined) {
    const host = new URL(appUrl()).hostname.replace(/^www\./, "")
    const values = entries?.map((entry) => entry.siteUrl).filter((value): value is string => Boolean(value)) || []
    return values.find((value) => value === `sc-domain:${host}`)
        || values.find((value) => value.includes(host))
        || values[0]
}

export async function GET(request: NextRequest) {
    const destination = new URL("/super-admin/search-console", appUrl())
    try {
        const user = await requireAdmin()
        const code = request.nextUrl.searchParams.get("code")
        const state = request.nextUrl.searchParams.get("state")
        const store = await cookies()
        const savedState = store.get(STATE_COOKIE)?.value
        store.delete(STATE_COOKIE)
        if (!code || !state || !savedState || state !== savedState) throw new Error("Estado OAuth inválido")
        const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID
        const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET
        if (!clientId || !clientSecret) throw new Error("OAuth não configurado")
        const tokenResponse = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: `${appUrl()}${CALLBACK_PATH}`, grant_type: "authorization_code" }) })
        if (!tokenResponse.ok) throw new Error("Não foi possível trocar o código OAuth")
        const token = await tokenResponse.json() as { access_token?: string; refresh_token?: string }
        if (!token.access_token || !token.refresh_token) throw new Error("O Google não retornou um refresh token")
        const sitesResponse = await fetch(SITES_URL, { headers: { Authorization: `Bearer ${token.access_token}` } })
        if (!sitesResponse.ok) throw new Error("Não foi possível listar as propriedades do Search Console")
        const sites = await sitesResponse.json() as { siteEntry?: Array<{ siteUrl?: string }> }
        const siteUrl = preferredSite(sites.siteEntry)
        if (!siteUrl) throw new Error("Nenhuma propriedade do Search Console foi encontrada nessa conta")
        await prisma.googleSearchConsoleConnection.upsert({ where: { userId: user.id }, create: { userId: user.id, siteUrl, refreshTokenEncrypted: encryptSecret(token.refresh_token) }, update: { siteUrl, refreshTokenEncrypted: encryptSecret(token.refresh_token) } })
        destination.searchParams.set("connected", "1")
    } catch (error) {
        console.error("[google-search-console] OAuth callback falhou:", error)
        destination.searchParams.set("error", "connect_failed")
    }
    return NextResponse.redirect(destination)
}
