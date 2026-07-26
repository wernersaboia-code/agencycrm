"use client"

import { useEffect } from "react"

export function SyncLocaleCookie({ locale }: { locale: "pt" | "de" }) {
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
