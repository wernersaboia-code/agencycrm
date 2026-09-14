import type { ReactNode } from "react"
import type { AbstractIntlMessages } from "next-intl"
import { NextIntlClientProvider } from "next-intl"
import type { Locale } from "@/lib/i18n/locales"
import { AuthBrand } from "./auth-brand"
import { AuthLocaleSwitcher } from "./auth-locale-switcher"

// Moldura i18n das telas de auth: provê o contexto de tradução (locale +
// messages resolvidos na página, a partir de ?lang) e a marca/seletor. O
// AuthLayout continua só centralizando; este shell é quem sabe o idioma.
export function AuthShell({
    locale,
    messages,
    children,
}: {
    locale: Locale
    messages: AbstractIntlMessages
    children: ReactNode
}) {
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="relative w-full">
                <div className="absolute right-0 top-0">
                    <AuthLocaleSwitcher />
                </div>
                <div className="mb-8 flex justify-center">
                    <AuthBrand />
                </div>
                {children}
            </div>
        </NextIntlClientProvider>
    )
}
