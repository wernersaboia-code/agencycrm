import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { routing } from "@/lib/i18n/routing"
import type { Locale } from "@/lib/i18n/locales"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { MarketplaceFooter } from "@/components/marketplace/marketplace-footer"
import { CartProvider } from "@/contexts/cart-context"
import { CartDrawer } from "@/components/marketplace/cart-drawer"

export const metadata: Metadata = {
    title: {
        absolute: "Easy Prospect - Leads Qualificados de Comércio Exterior",
        template: "%s | Easy Prospect",
    },
    description: "Encontre compradores e fornecedores internacionais com dados verificados e prontos para prospecção.",
    openGraph: {
        type: "website",
        siteName: "Easy Prospect",
        title: "Easy Prospect - Leads Qualificados de Comércio Exterior",
        description: "Encontre compradores e fornecedores internacionais com dados verificados e prontos para prospecção.",
        images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Easy Prospect - Leads Qualificados de Comércio Exterior",
        description: "Encontre compradores e fornecedores internacionais com dados verificados.",
        images: ["/opengraph-image"],
    },
}

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }))
}

export default async function MarketplaceLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    if (!hasLocale(routing.locales, locale)) notFound()

    // Sem isto as páginas do segmento viram dinâmicas e perdem o ISR.
    setRequestLocale(locale)

    const messages = await getMessages()

    return (
        // Repassar o pacote inteiro (~15 KB): a lista curada de namespaces já
        // quebrou componentes client ao serem usados em páginas novas, e o
        // ganho de payload não paga o risco.
        <NextIntlClientProvider locale={locale} messages={messages}>
            <CartProvider>
                <div className="min-h-screen flex flex-col">
                    <Suspense fallback={<div className="h-16 bg-background border-b" />}>
                        <MarketplaceHeader />
                    </Suspense>

                    <main id="main-content" className="flex-1">
                        {children}
                    </main>

                    <MarketplaceFooter locale={locale as Locale} />

                    {/* Cart Drawer - Global */}
                    <CartDrawer />
                </div>
            </CartProvider>
        </NextIntlClientProvider>
    )
}
