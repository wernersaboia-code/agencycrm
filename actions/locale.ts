"use server"

import { cookies } from "next/headers"
import { resolveSiteLocale } from "@/lib/i18n/resolve-locale"

export async function setLocaleCookie(locale: string): Promise<void> {
    const resolved = resolveSiteLocale(locale, undefined)
    ;(await cookies()).set("NEXT_LOCALE", resolved, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
    })
}
