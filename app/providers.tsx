// app/providers.tsx

"use client"

import { ThemeProvider } from "@/components/providers/theme-provider"
import { ActiveCallProvider } from "@/contexts/active-call-context"
import { CookieConsent, type CookieConsentLabels } from "@/components/cookie-consent"
import { Toaster } from "sonner"

export function Providers({
    children,
    cookieConsent,
}: {
    children: React.ReactNode
    // Traduzido no servidor por cada root layout: o banner fica fora do
    // <NextIntlClientProvider> e não consegue ler o namespace por conta própria.
    cookieConsent: CookieConsentLabels
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <ActiveCallProvider>
                {children}
            </ActiveCallProvider>
            <Toaster position="top-right" richColors />
            <CookieConsent labels={cookieConsent} />
        </ThemeProvider>
    )
}