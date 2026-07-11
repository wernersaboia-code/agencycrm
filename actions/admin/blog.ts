// actions/admin/blog.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { sanitizeHtmlForPreview } from "@/lib/utils/html-sanitizer"
import {
    postCoreSchema,
    translationInputSchema,
    categoryInputSchema,
    assertPublishable,
} from "@/lib/validations/blog"
import { z } from "zod"

const createPostSchema = postCoreSchema.extend({
    translations: z.array(translationInputSchema).default([]),
})

export type TranslationInput = z.infer<typeof translationInputSchema>
export type PostCoreInput = z.infer<typeof postCoreSchema> & {
    translations: TranslationInput[]
}
export type CategoryInput = z.infer<typeof categoryInputSchema>

function revalidateBlog() {
    revalidatePath("/super-admin/blog")
    revalidatePath("/blog", "layout")
    revalidatePath("/", "page")
    revalidatePath("/de", "page")
}

function sanitizeTranslations<T extends { contentHtml: string }>(translations: T[]): T[] {
    return translations.map((t) => ({ ...t, contentHtml: sanitizeHtmlForPreview(t.contentHtml) }))
}

// ---------- Categorias ----------
export async function listCategoriesAdmin() {
    await requireAdmin()
    return prisma.blogCategory.findMany({
        orderBy: { createdAt: "asc" },
        include: { translations: true, _count: { select: { posts: true } } },
    })
}

export async function createCategory(input: unknown) {
    await requireAdmin()
    const data = categoryInputSchema.parse(input)
    const category = await prisma.blogCategory.create({
        data: { key: data.key, translations: { create: data.translations } },
    })
    revalidateBlog()
    return category.id
}

export async function updateCategory(id: string, input: unknown) {
    await requireAdmin()
    const data = categoryInputSchema.parse(input)
    await prisma.$transaction([
        prisma.blogCategoryTranslation.deleteMany({ where: { categoryId: id } }),
        prisma.blogCategory.update({
            where: { id },
            data: { key: data.key, translations: { create: data.translations } },
        }),
    ])
    revalidateBlog()
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

export async function createPost(input: unknown) {
    const admin = await requireAdmin()
    const data = createPostSchema.parse(input)
    const translations = sanitizeTranslations(data.translations)
    assertPublishable(data.status, translations)

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
    return post.id
}

export async function updatePost(id: string, input: unknown) {
    await requireAdmin()
    const data = createPostSchema.parse(input)
    const translations = sanitizeTranslations(data.translations)
    assertPublishable(data.status, translations)

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
}

export async function deletePost(id: string) {
    await requireAdmin()
    await prisma.blogPost.delete({ where: { id } })
    revalidateBlog()
}
