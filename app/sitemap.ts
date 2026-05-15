import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://easyprospect.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
        { url: `${BASE_URL}/catalog`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
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

        return [...staticRoutes, ...listRoutes]
    } catch {
        return staticRoutes
    }
}
