// lib/blog/queries.ts

import { prisma } from "@/lib/prisma"
import type { BlogLocale } from "./locales"

export function publishedWhere(now: Date = new Date()) {
    return { status: "PUBLISHED" as const, publishedAt: { lte: now } }
}

export async function getPublishedPostsForLocale(
    locale: BlogLocale,
    opts: { categoryKey?: string; page?: number; pageSize?: number } = {}
) {
    const rawPage = Math.floor(Number(opts.page ?? 1))
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
    const rawPageSize = Math.floor(Number(opts.pageSize ?? 9))
    const pageSize = Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.min(50, rawPageSize) : 9
    const where = {
        ...publishedWhere(),
        translations: { some: { locale } },
        ...(opts.categoryKey ? { category: { key: opts.categoryKey } } : {}),
    }

    const [rows, total] = await Promise.all([
        prisma.blogPost.findMany({
            where,
            orderBy: { publishedAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                translations: { where: { locale } },
                category: { include: { translations: { where: { locale } } } },
            },
        }),
        prisma.blogPost.count({ where }),
    ])

    const posts = rows.map((p) => ({
        id: p.id,
        coverImageUrl: p.coverImageUrl,
        publishedAt: p.publishedAt,
        translation: p.translations[0],
        categoryName: p.category?.translations[0]?.name ?? null,
        categoryKey: p.category?.key ?? null,
    }))

    return { posts, total }
}

export async function getPostBySlug(locale: BlogLocale, slug: string) {
    const translation = await prisma.blogPostTranslation.findUnique({
        where: { locale_slug: { locale, slug } },
        include: {
            post: {
                include: {
                    translations: { select: { locale: true, slug: true } },
                    category: { include: { translations: { where: { locale } } } },
                },
            },
        },
    })

    if (!translation) return null
    const post = translation.post
    const now = new Date()
    if (post.status !== "PUBLISHED" || !post.publishedAt || post.publishedAt > now) {
        return null
    }

    return {
        post,
        translation,
        availableLocales: post.translations.map((t) => t.locale as BlogLocale),
        localeSlugs: Object.fromEntries(post.translations.map((t) => [t.locale, t.slug])) as Record<string, string>,
        categoryName: post.category?.translations[0]?.name ?? null,
    }
}

export async function getLatestPostsForTeaser(locale: BlogLocale, limit = 3) {
    const rows = await prisma.blogPost.findMany({
        where: { ...publishedWhere(), translations: { some: { locale } } },
        orderBy: { publishedAt: "desc" },
        take: limit,
        include: {
            translations: { where: { locale } },
            category: { include: { translations: { where: { locale } } } },
        },
    })
    return rows.map((p) => ({
        postId: p.id,
        slug: p.translations[0]?.slug ?? "",
        title: p.translations[0]?.title ?? "",
        excerpt: p.translations[0]?.excerpt ?? "",
        coverImageUrl: p.coverImageUrl,
        categoryName: p.category?.translations[0]?.name ?? null,
    }))
}
