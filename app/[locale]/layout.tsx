import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server"
import { routing } from "@/lib/i18n/routing"
import { htmlLangFor, dirForLocale, type Locale } from "@/lib/i18n/locales"
import { robotsForLocale } from "@/lib/seo/indexability"
import { JsonLd } from "@/components/seo/json-ld"
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/schema"
import "../globals.css"
import { Providers } from "../providers"
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { MarketplaceFooter } from "@/components/marketplace/marketplace-footer"
import { SyncLocaleCookie } from "@/components/marketplace/sync-locale-cookie"
import { CartProvider } from "@/contexts/cart-context"
import { CartDrawer } from "@/components/marketplace/cart-drawer"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params

    // Segmento que não é idioma (`/llms.txt`, `/qualquer-coisa`) casa com esta
    // rota e vai terminar em 404 — mas a metadata roda ANTES do `notFound()` do
    // layout. Sem esta saída antecipada, o next-intl é acionado com um locale
    // inválido, cai no cookie e transforma uma página pré-renderizada em
    // dinâmica no meio da requisição: o Next responde 500 no lugar do 404.
    if (!hasLocale(routing.locales, locale)) {
        return {}
    }

    return {
        // Vinham do layout único que existia acima deste. Como agora ESTE é o
        // root layout do funil, precisam ser declarados aqui: sem
        // `metadataBase`, toda URL relativa de imagem (og:image) sai quebrada
        // no compartilhamento.
        metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.easyprospect.com.br"),
        manifest: "/manifest.json",
        keywords: ["leads", "comércio exterior", "prospecção", "B2B", "importadores", "distribuidores", "marketplace", "importação", "exportação"],
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
        robots: robotsForLocale(locale),
    }
}

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }))
}

/**
 * A lista de idiomas é fechada: só os 8 de `generateStaticParams` existem.
 *
 * Sem isto, um caminho de um segmento só que não é idioma (`/llms.txt`,
 * `/ads.txt` — bots pedem esses o tempo todo) casa com `/[locale]` e o Next
 * tenta renderizá-lo sob demanda. Como a rota foi pré-renderizada, qualquer
 * API dinâmica no caminho (o `requestLocale` do next-intl lê header) estoura
 * "Page changed from static to dynamic at runtime" e o servidor responde 500
 * no lugar de 404. Com `dynamicParams = false`, o Next devolve 404 direto, sem
 * renderizar nada.
 */
export const dynamicParams = false

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

    const tCookies = await getTranslations({ locale, namespace: "cookies" })
    const tA11y = await getTranslations({ locale, namespace: "a11y" })

    return (
        // Este é o root layout do funil: o `<html>` sai daqui, e não de um
        // layout único no topo de `app/`. O motivo é o `lang`: um layout acima
        // do segmento não enxerga `params.locale` e precisaria ler o cookie
        // (`getLocale()`), o que desligava a renderização estática de todas as
        // páginas. Com o locale vindo da própria URL, o funil volta a ser
        // pré-renderizado e servido pela CDN. As áreas internas têm o seu root
        // layout em `app/(app)`.
        <html lang={htmlLangFor(locale as Locale)} dir={dirForLocale(locale as Locale)} suppressHydrationWarning>
        <head>
            <link rel="preconnect" href="https://api.supabase.co" />
            <link rel="preconnect" href="https://flagcdn.com" />
            <link rel="preconnect" href="https://api.paypal.com" />
        </head>
        <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <JsonLd data={buildOrganizationSchema()} />
        <JsonLd data={buildWebSiteSchema()} />
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
            {tA11y("skipToContent")}
        </a>
        <Providers
            cookieConsent={{
                message: tCookies("message"),
                learnMore: tCookies("learnMore"),
                decline: tCookies("decline"),
                accept: tCookies("accept"),
            }}
        >
            <NextIntlClientProvider locale={locale} messages={messages}>
                <CartProvider>
                    <div className="min-h-screen flex flex-col">
                        <Suspense fallback={<div className="h-16 bg-background border-b" />}>
                            <MarketplaceHeader />
                        </Suspense>

                        <SyncLocaleCookie locale={locale as Locale} />

                        <main id="main-content" className="flex-1">
                            {children}
                        </main>

                        <MarketplaceFooter locale={locale as Locale} />

                        {/* Cart Drawer - Global */}
                        <CartDrawer />
                    </div>
                </CartProvider>
            </NextIntlClientProvider>
        </Providers>
        <Analytics />
        <SpeedInsights />
        </body>
        </html>
    )
}
