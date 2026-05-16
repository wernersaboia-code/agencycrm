// app/layout.tsx
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
})

const mono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
})

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://easyprospect.com"),
    title: {
        default: "LeadStore & AgencyCRM",
        template: "%s | LeadStore",
    },
    description: "Leads qualificados de comércio exterior e CRM para prospecção B2B. Encontre compradores e fornecedores internacionais com dados verificados.",
    keywords: ["leads", "comércio exterior", "prospecção", "B2B", "CRM", "marketplace", "importação", "exportação"],
    openGraph: {
        type: "website",
        siteName: "LeadStore",
        title: "LeadStore & AgencyCRM",
        description: "Leads qualificados de comércio exterior e CRM para prospecção B2B.",
        images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
    },
    twitter: {
        card: "summary_large_image",
        title: "LeadStore & AgencyCRM",
        description: "Leads qualificados de comércio exterior e CRM para prospecção B2B.",
        images: ["/opengraph-image.png"],
    },
    robots: { index: true, follow: true },
    icons: { icon: "/icon.svg" },
    manifest: "/manifest.json",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
        <head>
            <link rel="preconnect" href="https://api.supabase.co" />
            <link rel="preconnect" href="https://flagcdn.com" />
            <link rel="preconnect" href="https://api.paypal.com" />
        </head>
        <body className={`${inter.variable} ${mono.variable} font-sans antialiased`}>
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
            Pular para o conteúdo
        </a>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
        </body>
        </html>
    )
}
