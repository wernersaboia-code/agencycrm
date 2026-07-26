"use client"

import { useEffect } from "react"

import type { Locale } from "@/lib/i18n/locales"

export function SyncLocaleCookie({ locale }: { locale: Locale }) {
    useEffect(() => {
        const current = document.cookie
            .split("; ")
            .find((c) => c.startsWith("NEXT_LOCALE="))
            ?.split("=")[1]
        if (current !== locale) {
            document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`
        }
    }, [locale])

    return null
}
