import type { Metadata } from "next"
import { Suspense } from "react"
import { NextIntlClientProvider } from "next-intl"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { MarketplaceFooter } from "@/components/marketplace/marketplace-footer"
import { CartProvider } from "@/contexts/cart-context"
import { CartDrawer } from "@/components/marketplace/cart-drawer"
import { HtmlLang } from "@/components/marketplace/html-lang"
import deMessages from "@/messages/de.json"

export const metadata: Metadata = {
    title: {
        absolute: "Easy Prospect",
        template: "%s | Easy Prospect",
    },
    openGraph: {
        type: "website",
        siteName: "Easy Prospect",
        locale: "de_DE",
        images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
}

export default function GermanLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <NextIntlClientProvider locale="de" messages={{ nav: deMessages.nav }}>
            <HtmlLang lang="de" />
            <CartProvider>
                <div className="min-h-screen flex flex-col">
                    <Suspense fallback={<div className="h-16 bg-background border-b" />}>
                        <MarketplaceHeader />
                    </Suspense>

                    <main id="main-content" className="flex-1">
                        {children}
                    </main>

                    <MarketplaceFooter locale="de" />

                    <CartDrawer />
                </div>
            </CartProvider>
        </NextIntlClientProvider>
    )
}
