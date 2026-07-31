import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listCategoriesAdmin } from "@/actions/admin/blog"
import { PostEditor } from "@/components/admin/blog/post-editor"
import { getAdminTranslations } from "@/lib/i18n/admin-locale"

export const dynamic = "force-dynamic"

export default async function NewBlogPostPage() {
    const categories = await listCategoriesAdmin()
    const t = await getAdminTranslations("admin.blogEditor")
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t("newTitle")}</h1>
                <Button variant="outline" asChild><Link href="/super-admin/blog"><ArrowLeft className="h-4 w-4" /> {t("back")}</Link></Button>
            </div>
            <PostEditor
                categories={categories.map((c) => ({ id: c.id, name: c.translations.find((t) => t.locale === "pt")?.name ?? c.key }))}
                initial={{ coverImageUrl: null, categoryId: null, status: "DRAFT", publishedAt: null, translations: {} }}
            />
        </div>
    )
}
