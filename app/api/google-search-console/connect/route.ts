import crypto from "crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

const STATE_COOKIE = "gsc_oauth_state"
const CALLBACK_PATH = "/api/google-search-console/callback"

function appUrl() { return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001").replace(/\/$/, "") }

export async function GET() {
    try {
        await requireAdmin()
        const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID
        if (!clientId) return NextResponse.redirect(new URL("/super-admin/search-console?error=not_configured", appUrl()))
        const state = crypto.randomBytes(32).toString("base64url")
        const store = await cookies()
        store.set(STATE_COOKIE, state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: CALLBACK_PATH, maxAge: 600 })
        const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
        url.searchParams.set("client_id", clientId)
        url.searchParams.set("redirect_uri", `${appUrl()}${CALLBACK_PATH}`)
        url.searchParams.set("response_type", "code")
        url.searchParams.set("scope", "https://www.googleapis.com/auth/webmasters.readonly")
        url.searchParams.set("access_type", "offline")
        url.searchParams.set("prompt", "consent")
        url.searchParams.set("state", state)
        return NextResponse.redirect(url)
    } catch {
        return NextResponse.redirect(new URL("/sign-in", appUrl()))
    }
}
