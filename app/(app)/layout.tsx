// app/layout.tsx
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { SiteAnalytics } from "@/components/analytics/site-analytics"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { headers } from "next/headers"
import { getLocale, getTranslations } from "next-intl/server"
import { getAdminLocale } from "@/lib/i18n/admin-locale"
import { isSuperAdminPath } from "@/lib/auth/super-admin-gate"
import { htmlLangFor, dirForLocale, type Locale } from "@/lib/i18n/locales"
import "../globals.css"
import { Providers } from "../providers"
import { JsonLd } from "@/components/seo/json-ld"
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/schema"

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.easyprospect.com.br"),
    title: {
        default: "Easy Prospect",
        template: "%s | Easy Prospect",
    },
    description: "Listas qualificadas de importadores e distribuidores para prospecção B2B internacional. Encontre parceiros comerciais com dados verificados.",
    keywords: ["leads", "comércio exterior", "prospecção", "B2B", "importadores", "distribuidores", "marketplace", "importação", "exportação"],
    openGraph: {
        type: "website",
        siteName: "Easy Prospect",
        title: "Easy Prospect",
        description: "Listas qualificadas de importadores e distribuidores para prospecção B2B internacional.",
        images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Easy Prospect",
        description: "Listas qualificadas de importadores e distribuidores para prospecção B2B internacional.",
        images: ["/opengraph-image"],
    },
    robots: { index: true, follow: true },
    manifest: "/manifest.json",
}

/**
 * Root layout das áreas internas: CRM, super-admin, autenticação, `/crm`,
 * `/privacy` e `/terms`. O funil tem o SEU root layout em `app/[locale]`.
 *
 * São dois porque o `<html lang>` precisa sair certo já no servidor e cada
 * lado descobre o idioma de um jeito: o funil tem o locale na própria URL, e
 * aqui só existe o cookie. Enquanto um único layout servia os dois, ele
 * chamava `getLocale()` — que lê cookie — e isso desligava a renderização
 * estática de TODAS as páginas, inclusive as do funil, que não dependiam
 * disso. Aqui a leitura de cookie continua (não há alternativa e não custa
 * nada: toda rota deste grupo exige sessão ou é `noindex`).
 */
export default async function AppRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    // Resolvido no servidor: corrigir `lang` só depois da hidratação entrega o
    // idioma errado ao leitor de tela na primeira renderização e ao crawler.
    // O super-admin fala o idioma da CONTA (lib/i18n/admin-locale.ts), não o
    // do cookie do funil; o caminho vem do x-pathname que o proxy injeta.
    const pathname = (await headers()).get("x-pathname") ?? ""
    const locale = isSuperAdminPath(pathname)
        ? await getAdminLocale()
        : ((await getLocale()) as Locale)

    // Mesma origem do `lang` acima, para o link de pular e o banner não
    // falarem outro idioma que o da página.
    const tCookies = await getTranslations({ locale, namespace: "cookies" })
    const tA11y = await getTranslations({ locale, namespace: "a11y" })

    return (
        <html lang={htmlLangFor(locale)} dir={dirForLocale(locale)} suppressHydrationWarning>
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
            {children}
        </Providers>
        <SiteAnalytics somenteEntrada />
        <SpeedInsights />
        </body>
        </html>
    )
}
