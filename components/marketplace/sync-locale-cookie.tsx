"use client"

import { useEffect } from "react"

import type { Locale } from "@/lib/i18n/locales"

function sync(locale: Locale) {
    const current = document.cookie
        .split("; ")
        .find((c) => c.startsWith("NEXT_LOCALE="))
        ?.split("=")[1]
    if (current !== locale) {
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`
    }
}

export function SyncLocaleCookie({ locale }: { locale: Locale }) {
    useEffect(() => {
        sync(locale)

        // Volta do bfcache (botão voltar/avançar) não remonta o componente,
        // então o efeito acima não roda de novo e o cookie pode ter ficado
        // com o idioma de outra aba. Numa página em pt isso fazia os links
        // sem prefixo (/blog?page=2) serem redirecionados para /en/blog.
        const onPageShow = (event: PageTransitionEvent) => {
            if (event.persisted) sync(locale)
        }
        window.addEventListener("pageshow", onPageShow)
        return () => window.removeEventListener("pageshow", onPageShow)
    }, [locale])

    return null
}
