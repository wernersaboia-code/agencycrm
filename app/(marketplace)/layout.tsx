import type { Metadata } from "next"
import { Suspense } from "react"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { MarketplaceFooter } from "@/components/marketplace/marketplace-footer"
import { CartProvider } from "@/contexts/cart-context"
import { CartDrawer } from "@/components/marketplace/cart-drawer"

export const metadata: Metadata = {
    title: {
        default: "LeadStore - Leads Qualificados de Comércio Exterior",
        template: "%s | LeadStore",
    },
    description: "Encontre compradores e fornecedores internacionais com dados verificados e prontos para prospecção.",
    openGraph: {
        type: "website",
        siteName: "LeadStore",
        title: "LeadStore - Leads Qualificados de Comércio Exterior",
        description: "Encontre compradores e fornecedores internacionais com dados verificados e prontos para prospecção.",
        images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
    },
    twitter: {
        card: "summary_large_image",
        title: "LeadStore - Leads Qualificados de Comércio Exterior",
        description: "Encontre compradores e fornecedores internacionais com dados verificados.",
        images: ["/opengraph-image.png"],
    },
}

export default function MarketplaceLayout({
                                              children,
                                          }: {
    children: React.ReactNode
}) {
    return (
        <CartProvider>
            <div className="min-h-screen flex flex-col">
                <Suspense fallback={<div className="h-16 bg-background border-b" />}>
                    <MarketplaceHeader />
                </Suspense>

                <main id="main-content" className="flex-1">
                    {children}
                </main>

                <MarketplaceFooter />

                {/* Cart Drawer - Global */}
                <CartDrawer />
            </div>
        </CartProvider>
    )
}