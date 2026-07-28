import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPostAdmin, listCategoriesAdmin } from "@/actions/admin/blog"
import { PostEditor, type PostEditorInitial } from "@/components/admin/blog/post-editor"
import type { BlogLocale } from "@/lib/blog/locales"

export const dynamic = "force-dynamic"

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const [post, categories] = await Promise.all([getPostAdmin(id), listCategoriesAdmin()])
    if (!post) notFound()

    const translations: PostEditorInitial["translations"] = {}
    for (const t of post.translations) {
        translations[t.locale as BlogLocale] = {
            title: t.title, slug: t.slug, excerpt: t.excerpt,
            contentHtml: t.contentHtml, metaDescription: t.metaDescription ?? "",
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Editar post</h1>
                <Button variant="outline" asChild><Link href="/super-admin/blog"><ArrowLeft className="h-4 w-4" /> Voltar</Link></Button>
            </div>
            <PostEditor
                categories={categories.map((c) => ({ id: c.id, name: c.translations.find((t) => t.locale === "pt")?.name ?? c.key }))}
                initial={{
                    id: post.id,
                    coverImageUrl: post.coverImageUrl,
                    categoryId: post.categoryId,
                    status: post.status,
                    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
                    translations,
                }}
            />
        </div>
    )
}
