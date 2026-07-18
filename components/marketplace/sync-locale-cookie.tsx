"use client"

import { useEffect } from "react"

// Mantém o cookie NEXT_LOCALE alinhado com a landing exibida, para que o
// funil (que resolve o idioma pelo cookie) siga o mesmo idioma.
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
