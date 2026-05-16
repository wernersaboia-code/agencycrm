"use client"

import { useState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"

const CONSENT_KEY = "cookie-consent"

function getConsent() {
    if (typeof window === "undefined") return "unknown"
    return localStorage.getItem(CONSENT_KEY) || "unknown"
}

function subscribeConsent(callback: () => void) {
    const handler = () => callback()
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
}

export function CookieConsent() {
    const consent = useSyncExternalStore(subscribeConsent, getConsent, () => "unknown")
    const [dismissed, setDismissed] = useState(false)

    const accept = () => {
        localStorage.setItem(CONSENT_KEY, "accepted")
        setDismissed(true)
    }

    const decline = () => {
        localStorage.setItem(CONSENT_KEY, "declined")
        setDismissed(true)
    }

    if (consent !== "unknown" || dismissed) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-4 sm:flex-row sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    Usamos cookies essenciais para autenticação e preferências.
                    Cookies de analytics são carregados apenas com seu consentimento.
                    {" "}
                    <a href="/privacy" className="underline hover:text-foreground">
                        Saiba mais
                    </a>
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={decline}>
                        Recusar
                    </Button>
                    <Button size="sm" onClick={accept}>
                        Aceitar
                    </Button>
                </div>
            </div>
        </div>
    )
}
