import { z } from "zod"
import { BLOG_LOCALES } from "@/lib/blog/locales"

export const blogLocaleSchema = z.enum(BLOG_LOCALES)

export const translationInputSchema = z.object({
    locale: blogLocaleSchema,
    title: z.string().trim().min(1).max(200),
    slug: z.string().trim().min(1).max(220).regex(/^[a-z0-9-]+$/),
    excerpt: z.string().trim().max(500),
    contentHtml: z.string().max(200_000),
    metaDescription: z.string().trim().max(320).optional(),
    ogImageUrl: z.string().url().max(1000).optional(),
})

export const postCoreSchema = z.object({
    coverImageUrl: z.string().url().max(1000).optional().nullable(),
    categoryId: z.string().min(1).optional().nullable(),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    publishedAt: z.coerce.date().optional().nullable(),
})

export const categoryInputSchema = z.object({
    key: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
    translations: z.array(z.object({
        locale: blogLocaleSchema,
        name: z.string().trim().min(1).max(120),
    })).min(1),
})

function stripTags(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
}

export function hasCompleteTranslation(
    translations: { title: string; contentHtml: string }[]
): boolean {
    return translations.some((t) => t.title.trim().length > 0 && stripTags(t.contentHtml).length > 0)
}

export function assertPublishable(
    status: "DRAFT" | "PUBLISHED",
    translations: { title: string; contentHtml: string }[]
): void {
    if (status === "PUBLISHED" && !hasCompleteTranslation(translations)) {
        throw new Error("Publicar exige ao menos um idioma completo")
    }
}
