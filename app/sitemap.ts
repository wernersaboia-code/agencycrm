import type { MetadataRoute } from "next"
import { getPathname } from "@/lib/i18n/navigation"
import { PUBLISHED_LOCALES, type Locale } from "@/lib/i18n/locales"
import { alternatesFor } from "@/lib/i18n/alternates"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.easyprospect.com.br"

// Rotas estáticas do funil: uma entrada por idioma publicado, com hreflang
// de mão dupla via alternatesFor. `/blog` entra aqui (não mais no bloco
// dinâmico abaixo) para não duplicar a URL do índice do blog.
//
// Iteramos sobre PUBLISHED_LOCALES, não LOCALES: locales roteáveis sem
// tradução própria caem no fallback para pt (ver i18n/request.ts) e não
// devem ser submetidos ao buscador como se tivessem conteúdo próprio.
const ROUTES: { path: string; changeFrequency: "daily" | "weekly" | "monthly"; priority: number }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/catalog", changeFrequency: "daily", priority: 0.9 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes = ROUTES.flatMap((route) =>
        PUBLISHED_LOCALES.map((locale) => {
            return {
                url: `${BASE_URL}${getPathname({ href: route.path, locale })}`,
                lastModified: new Date(),
                changeFrequency: route.changeFrequency,
                priority: route.priority,
                alternates: { languages: alternatesFor(route.path).languages },
            }
        })
    )

    try {
        const { prisma } = await import("@/lib/prisma")
        const lists = await prisma.leadList.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 1000,
        })

        const listRoutes = lists.map((list) => ({
            url: `${BASE_URL}/list/${list.slug}`,
            lastModified: list.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }))

        const now = new Date()
        const blogPosts = await prisma.blogPost.findMany({
            where: { status: "PUBLISHED", publishedAt: { lte: now } },
            select: { updatedAt: true, translations: { select: { locale: true, slug: true } } },
            take: 2000,
        })

        const blogRoutes = blogPosts.flatMap((post) => {
            const languages = Object.fromEntries(
                post.translations.map((t) => [t.locale, `${BASE_URL}${getPathname({ href: `/blog/${t.slug}`, locale: t.locale as Locale })}`])
            )
            return post.translations.map((t) => ({
                url: `${BASE_URL}${getPathname({ href: `/blog/${t.slug}`, locale: t.locale as Locale })}`,
                lastModified: post.updatedAt,
                changeFrequency: "weekly" as const,
                priority: 0.6,
                alternates: { languages },
            }))
        })

        // O índice do blog (/blog) já está em ROUTES/staticRoutes acima —
        // aqui só entram os posts individuais, que vêm do banco.
        return [...staticRoutes, ...listRoutes, ...blogRoutes]
    } catch {
        return staticRoutes
    }
}
