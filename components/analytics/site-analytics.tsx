"use client"

import { useEffect } from "react"
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react"
import { contaComoAudiencia, MARCA_EQUIPE } from "@/lib/analytics/trafego-interno"

function navegadorDaEquipe(): boolean {
    try {
        return localStorage.getItem(MARCA_EQUIPE) === "1"
    } catch {
        return false
    }
}

/**
 * Web Analytics sem o tráfego da equipe (ver lib/analytics/trafego-interno.ts).
 * `somenteEntrada` vai na área logada, onde só /sign-in e /sign-up contam.
 */
export function SiteAnalytics({ somenteEntrada = false }: { somenteEntrada?: boolean }) {
    return (
        <Analytics
            beforeSend={(event: BeforeSendEvent) =>
                contaComoAudiencia(event.url, { daEquipe: navegadorDaEquipe(), somenteEntrada }) ? event : null
            }
        />
    )
}

/** Marca o navegador como da equipe. Vai no layout do admin. */
export function MarcarNavegadorDaEquipe() {
    useEffect(() => {
        try {
            localStorage.setItem(MARCA_EQUIPE, "1")
        } catch {
            // Sem localStorage (janela privada bloqueada): a visita volta a contar.
        }
    }, [])
    return null
}
