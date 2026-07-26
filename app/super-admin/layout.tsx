// app/super-admin/layout.tsx

import type { ReactNode } from "react"
import type { AbstractIntlMessages } from "next-intl"
import { NextIntlClientProvider } from "next-intl"
import { redirect } from "next/navigation"
import { getAuthenticatedDbUser } from "@/lib/auth"
import { resolveMessagesLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales"
import { loadMessages } from "@/lib/i18n/load-messages"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"


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

    const locale: Locale = (dbUser.language && resolveMessagesLocale(dbUser.language as Locale)) || DEFAULT_LOCALE
    const messages: AbstractIntlMessages = await loadMessages(locale)

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
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
        </NextIntlClientProvider>
    )
}
