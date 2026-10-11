// app/super-admin/layout.tsx

import type { ReactNode } from "react"
import type { AbstractIntlMessages } from "next-intl"
import { NextIntlClientProvider } from "next-intl"
import { redirect } from "next/navigation"
import { getAuthenticatedDbUser } from "@/lib/auth"
import { getAdminLocale, getAdminTranslations } from "@/lib/i18n/admin-locale"
import { loadMessages } from "@/lib/i18n/load-messages"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { MarcarNavegadorDaEquipe } from "@/components/analytics/site-analytics"
import { CookieConsent } from "@/components/cookie-consent"
import { AdminHtmlLang } from "@/components/admin/admin-html-lang"
import { dirForLocale, htmlLangFor } from "@/lib/i18n/locales"


export default async function SuperAdminLayout({
                                                   children,
                                               }: {
    children: ReactNode
}) {
    const dbUser = await getAuthenticatedDbUser()

    if (!dbUser) {
        redirect("/sign-in")
    }

    if (dbUser.role !== "ADMIN" || dbUser.status !== "ACTIVE") {
        redirect("/dashboard")
    }

    // Mesma fonte que as páginas server usam via getAdminTranslations, para o
    // conteúdo e a moldura (sidebar/header) nunca saírem em idiomas diferentes.
    const locale = await getAdminLocale()
    const messages: AbstractIntlMessages = await loadMessages(locale)
    // O banner do root layout não re-renderiza em navegação suave (vindo do
    // CRM ele ficaria no idioma do cookie) e se cala aqui; este segue a conta.
    const tCookies = await getAdminTranslations("cookies")

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <AdminHtmlLang lang={htmlLangFor(locale)} dir={dirForLocale(locale)} />
            <MarcarNavegadorDaEquipe />
            <div className="flex h-screen bg-background">
                <AdminSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <AdminHeader
                        user={{ name: dbUser.name, email: dbUser.email }}
                        variant="super-admin"
                    />
                    <main id="main-content" className="flex-1 overflow-y-auto bg-background p-5 md:p-6">
                        {children}
                    </main>
                </div>
            </div>
            <CookieConsent
                area="admin"
                labels={{
                    message: tCookies("message"),
                    learnMore: tCookies("learnMore"),
                    decline: tCookies("decline"),
                    accept: tCookies("accept"),
                }}
            />
        </NextIntlClientProvider>
    )
}
