// lib/blog/queries.ts

import { prisma } from "@/lib/prisma"
import type { BlogLocale } from "./locales"
import { minutosDeLeitura } from "./tempo-leitura"

export function publishedWhere(now: Date = new Date()) {
    return { status: "PUBLISHED" as const, publishedAt: { lte: now } }
}

/**
 * Idiomas com ao menos um post publicado.
 *
 * O índice do blog existe nos 8 idiomas — a rota responde, os rótulos são
 * traduzidos —, mas num idioma sem post ele é uma listagem vazia. Página fina
 * não deve entrar no sitemap nem no hreflang dos idiomas que têm conteúdo, e
 * não deve ser indexada. Sitemap e página perguntam os dois aqui, pela mesma
 * razão de `getCategoriesWithPosts` morar ao lado de `publishedWhere`: dois
 * critérios para a mesma pergunta acabam divergindo.
 */
export async function localesComPostPublicado(): Promise<string[]> {
    const linhas = await prisma.blogPostTranslation.findMany({
        where: { post: publishedWhere() },
        select: { locale: true },
        distinct: ["locale"],
    })

    return linhas.map((linha) => linha.locale)
}

/**
 * Categorias que têm ao menos um post publicado NAQUELE idioma.
 *
 * Mora aqui, ao lado de `publishedWhere`, porque os dois precisam concordar:
 * se o chip aparecer com um critério e a listagem filtrar com outro, o leitor
 * clica na categoria e recebe "nenhum artigo publicado". É a mesma regra que o
 * catálogo já aplica às facetas — categoria vazia é promessa de conteúdo que
 * não existe.
 */
export async function getCategoriesWithPosts(locale: BlogLocale) {
    return prisma.blogCategory.findMany({
        where: {
            posts: {
                some: {
                    ...publishedWhere(),
                    translations: { some: { locale } },
                },
            },
        },
        orderBy: { createdAt: "asc" },
        include: { translations: { where: { locale } } },
    })
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
        // O cálculo mora aqui, e não no card: `contentHtml` é `@db.Text` e não
        // pode atravessar a fronteira do componente só para virar um número.
        minutosLeitura: minutosDeLeitura(p.translations[0]?.contentHtml ?? ""),
    }))
}

/**
 * Consulta da PRÉVIA: busca por id e **não** filtra por publicado — é
 * exatamente o que `getPostBySlug` recusa a fazer, e por isso não dá para
 * reaproveitá-la. Só é chamada de rota protegida por requireAdmin.
 *
 * `translation` volta null quando o idioma pedido ainda não foi escrito: a
 * prévia mostra um aviso, em vez de 404 num post que existe.
 */
export async function getPostForPreview(id: string, locale: BlogLocale) {
    const post = await prisma.blogPost.findUnique({
        where: { id },
        include: {
            translations: { where: { locale } },
            category: { include: { translations: { where: { locale } } } },
        },
    })

    if (!post) return null

    return {
        post,
        translation: post.translations[0] ?? null,
        categoryName: post.category?.translations[0]?.name ?? null,
    }
}
