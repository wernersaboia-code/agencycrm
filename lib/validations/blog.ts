import { z } from "zod"
import { BLOG_LOCALES } from "@/lib/blog/locales"

export const blogLocaleSchema = z.enum(BLOG_LOCALES)

/**
 * Limites de campo do post, em um só lugar para a UI mostrar o mesmo número
 * que o schema cobra. Contador que diverge da validação é pior que contador
 * nenhum: o usuário confia nele e perde o texto assim mesmo.
 *
 * `metaDescription` fica em 320 de propósito, e não acompanha o aumento dos
 * outros: o buscador corta por volta de 155 caracteres, então espaço extra ali
 * não é usado por ninguém — só desperdiçado.
 */
export const LIMITES_DE_POST = {
    title: 300,
    slug: 220,
    excerpt: 2000,
    contentHtml: 400_000,
    metaDescription: 320,
} as const

export const translationInputSchema = z.object({
    locale: blogLocaleSchema,
    title: z.string().trim().min(1).max(LIMITES_DE_POST.title),
    slug: z.string().trim().min(1).max(LIMITES_DE_POST.slug).regex(/^[a-z0-9-]+$/),
    excerpt: z.string().trim().max(LIMITES_DE_POST.excerpt),
    contentHtml: z.string().max(LIMITES_DE_POST.contentHtml),
    metaDescription: z.string().trim().max(LIMITES_DE_POST.metaDescription).optional(),
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

// Antes lançava. Trocado para retorno porque o chamador (createPost/updatePost
// em actions/admin/blog.ts) precisa devolver um erro de formulário, não deixar
// o Server Action estourar — é a mesma classe de bug do ZodError: exceção
// vira mensagem redigida pelo Next.js em produção.
export function assertPublishable(
    status: "DRAFT" | "PUBLISHED",
    translations: { title: string; contentHtml: string }[]
): { ok: true } | { ok: false; error: string } {
    if (status === "PUBLISHED" && !hasCompleteTranslation(translations)) {
        return { ok: false, error: "Publicar exige ao menos um idioma completo" }
    }
    return { ok: true }
}
