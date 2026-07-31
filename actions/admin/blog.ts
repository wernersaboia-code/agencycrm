// actions/admin/blog.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { sanitizeTranslations } from "@/lib/blog/sanitize-translations"
import {
    postCoreSchema,
    translationInputSchema,
    categoryInputSchema,
    assertPublishable,
} from "@/lib/validations/blog"
import { traduzirErrosDoPost, type ErroDeCampo } from "@/lib/validations/blog-erros"
import { z } from "zod"

const createPostSchema = postCoreSchema.extend({
    translations: z.array(translationInputSchema).default([]),
})

export type TranslationInput = z.infer<typeof translationInputSchema>
export type PostCoreInput = z.infer<typeof postCoreSchema> & {
    translations: TranslationInput[]
}
export type CategoryInput = z.infer<typeof categoryInputSchema>

// Resultado em vez de exceção: .parse() jogava o ZodError pra fora do Server
// Action e, em produção, o Next.js redige a mensagem (só sobra "ocorreu um
// erro" + digest). fieldErrors carrega o suficiente pra UI apontar campo e
// idioma; "error" é a mensagem genérica pra toast quando não há fieldErrors.
export type BlogFieldError = ErroDeCampo
type PostActionError = { success: false; error: string; fieldErrors?: BlogFieldError[] }
export type CreatePostResult = { success: true; id: string } | PostActionError
export type UpdatePostResult = { success: true } | PostActionError
type CategoryActionError = { success: false; error: string; fieldErrors?: BlogFieldError[] }
export type CreateCategoryResult = { success: true; id: string } | CategoryActionError
export type UpdateCategoryResult = { success: true } | CategoryActionError

// Extrai os locales na mesma ordem do array `translations` enviado, direto do
// input bruto — na falha do safeParse não temos `data` parseado, e o
// ZodIssue só carrega o índice numérico (path: ["translations", 0, "excerpt"]),
// não o locale em si.
function localesDoInput(input: unknown): string[] {
    if (input && typeof input === "object" && "translations" in input) {
        const translations = (input as { translations?: unknown }).translations
        if (Array.isArray(translations)) {
            return translations.map((t) =>
                t && typeof t === "object" && "locale" in t ? String((t as { locale?: unknown }).locale) : ""
            )
        }
    }
    return []
}

function revalidateBlog() {
    revalidatePath("/super-admin/blog")
    revalidatePath("/blog", "layout")
    revalidatePath("/", "page")
    revalidatePath("/de", "page")
}

// ---------- Categorias ----------
export async function listCategoriesAdmin() {
    await requireAdmin()
    return prisma.blogCategory.findMany({
        orderBy: { createdAt: "asc" },
        include: { translations: true, _count: { select: { posts: true } } },
    })
}

export async function createCategory(input: unknown): Promise<CreateCategoryResult> {
    await requireAdmin()
    const parsed = categoryInputSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: "invalid", fieldErrors: traduzirErrosDoPost(parsed.error.issues, localesDoInput(input)) }
    }

    const category = await prisma.blogCategory.create({
        data: { key: parsed.data.key, translations: { create: parsed.data.translations } },
    })
    revalidateBlog()
    return { success: true, id: category.id }
}

export async function updateCategory(id: string, input: unknown): Promise<UpdateCategoryResult> {
    await requireAdmin()
    const parsed = categoryInputSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: "invalid", fieldErrors: traduzirErrosDoPost(parsed.error.issues, localesDoInput(input)) }
    }

    await prisma.$transaction([
        prisma.blogCategoryTranslation.deleteMany({ where: { categoryId: id } }),
        prisma.blogCategory.update({
            where: { id },
            data: { key: parsed.data.key, translations: { create: parsed.data.translations } },
        }),
    ])
    revalidateBlog()
    return { success: true }
}

export async function deleteCategory(id: string) {
    await requireAdmin()
    const count = await prisma.blogPost.count({ where: { categoryId: id } })
    if (count > 0) {
        throw new Error("Categoria em uso: reatribua os posts antes de excluir")
    }
    await prisma.blogCategory.delete({ where: { id } })
    revalidateBlog()
}

// ---------- Posts ----------
export async function listPostsAdmin() {
    await requireAdmin()
    return prisma.blogPost.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
            translations: { select: { locale: true, title: true } },
            category: { include: { translations: true } },
        },
    })
}

export async function getPostAdmin(id: string) {
    await requireAdmin()
    return prisma.blogPost.findUnique({
        where: { id },
        include: { translations: true },
    })
}

export async function createPost(input: unknown): Promise<CreatePostResult> {
    const admin = await requireAdmin()
    const parsed = createPostSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: "invalid", fieldErrors: traduzirErrosDoPost(parsed.error.issues, localesDoInput(input)) }
    }

    const data = parsed.data
    const translations = sanitizeTranslations(data.translations)
    const publicavel = assertPublishable(data.status, translations)
    if (!publicavel.ok) {
        return { success: false, error: "notPublishable" }
    }

    const post = await prisma.blogPost.create({
        data: {
            coverImageUrl: data.coverImageUrl ?? null,
            categoryId: data.categoryId ?? null,
            status: data.status,
            publishedAt: data.publishedAt ?? (data.status === "PUBLISHED" ? new Date() : null),
            authorId: admin.id,
            translations: { create: translations },
        },
    })
    revalidateBlog()
    return { success: true, id: post.id }
}

export async function updatePost(id: string, input: unknown): Promise<UpdatePostResult> {
    await requireAdmin()
    const parsed = createPostSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: "invalid", fieldErrors: traduzirErrosDoPost(parsed.error.issues, localesDoInput(input)) }
    }

    const data = parsed.data
    const translations = sanitizeTranslations(data.translations)
    const publicavel = assertPublishable(data.status, translations)
    if (!publicavel.ok) {
        return { success: false, error: "notPublishable" }
    }

    await prisma.$transaction([
        prisma.blogPostTranslation.deleteMany({ where: { postId: id } }),
        prisma.blogPost.update({
            where: { id },
            data: {
                coverImageUrl: data.coverImageUrl ?? null,
                categoryId: data.categoryId ?? null,
                status: data.status,
                publishedAt: data.publishedAt ?? (data.status === "PUBLISHED" ? new Date() : null),
                translations: { create: translations },
            },
        }),
    ])
    revalidateBlog()
    return { success: true }
}

export async function deletePost(id: string) {
    await requireAdmin()
    await prisma.blogPost.delete({ where: { id } })
    revalidateBlog()
}
