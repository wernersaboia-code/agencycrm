"use server"

import { cookies } from "next/headers"
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, parseCurrency } from "@/lib/currency"

export async function setCurrencyCookie(currency: string): Promise<void> {
    const resolved = parseCurrency(currency) ?? DEFAULT_CURRENCY
    ;(await cookies()).set(CURRENCY_COOKIE, resolved, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
    })
}
