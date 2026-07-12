import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://easyprospect.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 1,
            alternates: { languages: { "pt-BR": BASE_URL, de: `${BASE_URL}/de` } },
        },
        {
            url: `${BASE_URL}/de`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 1,
            alternates: { languages: { "pt-BR": BASE_URL, de: `${BASE_URL}/de` } },
        },
        { url: `${BASE_URL}/catalog`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
        {
            url: `${BASE_URL}/faq`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.6,
            alternates: { languages: { "pt-BR": `${BASE_URL}/faq`, de: `${BASE_URL}/de/faq` } },
        },
        {
            url: `${BASE_URL}/de/faq`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.6,
            alternates: { languages: { "pt-BR": `${BASE_URL}/faq`, de: `${BASE_URL}/de/faq` } },
        },
    ]

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
                post.translations.map((t) => [t.locale, `${BASE_URL}/blog/${t.locale}/${t.slug}`])
            )
            return post.translations.map((t) => ({
                url: `${BASE_URL}/blog/${t.locale}/${t.slug}`,
                lastModified: post.updatedAt,
                changeFrequency: "weekly" as const,
                priority: 0.6,
                alternates: { languages },
            }))
        })

        const blogIndexRoutes = ["pt", "de", "en", "es", "fr", "ar", "it", "nl"].map((locale) => ({
            url: `${BASE_URL}/blog/${locale}`,
            lastModified: now,
            changeFrequency: "weekly" as const,
            priority: 0.5,
        }))

        return [...staticRoutes, ...listRoutes, ...blogIndexRoutes, ...blogRoutes]
    } catch {
        return staticRoutes
    }
}
