// app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
})

export const metadata: Metadata = {
    title: "LeadStore & AgencyCRM",
    description: "Leads qualificados de comércio exterior e CRM para prospecção",
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        </body>
        </html>
    )
}