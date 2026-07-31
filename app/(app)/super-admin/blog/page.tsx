// app/super-admin/blog/page.tsx
import Link from "next/link"
import { Plus, Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { listPostsAdmin } from "@/actions/admin/blog"
import { getAdminLocale, getAdminTranslations } from "@/lib/i18n/admin-locale"
import { htmlLangFor } from "@/lib/i18n/locales"

export const dynamic = "force-dynamic"

export default async function AdminBlogPage() {
    const posts = await listPostsAdmin()
    const t = await getAdminTranslations("admin.blog")
    const bcp47 = htmlLangFor(await getAdminLocale())

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("subtitle")}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/super-admin/blog/categories"><Tags className="h-4 w-4" /> {t("categories")}</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/super-admin/blog/new"><Plus className="h-4 w-4" /> {t("newPost")}</Link>
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-left">
                        <tr>
                            <th className="p-3">{t("colTitle")}</th>
                            <th className="p-3">{t("colStatus")}</th>
                            <th className="p-3">{t("colCategory")}</th>
                            <th className="p-3">{t("colLanguages")}</th>
                            <th className="p-3">{t("colPublished")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.length === 0 && (
                            <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{t("empty")}</td></tr>
                        )}
                        {posts.map((post) => {
                            const title = post.translations.find((tr) => tr.locale === "pt")?.title
                                ?? post.translations[0]?.title ?? t("noTitle")
                            const categoryName = post.category?.translations.find((tr) => tr.locale === "pt")?.name
                                ?? post.category?.translations[0]?.name ?? "—"
                            return (
                                <tr key={post.id} className="border-b last:border-0 hover:bg-muted/30">
                                    <td className="p-3">
                                        <Link href={`/super-admin/blog/${post.id}`} className="font-medium hover:underline">
                                            {title}
                                        </Link>
                                    </td>
                                    <td className="p-3">
                                        <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                                            {post.status === "PUBLISHED" ? t("badgePublished") : t("badgeDraft")}
                                        </Badge>
                                    </td>
                                    <td className="p-3">{categoryName}</td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-1">
                                            {post.translations.map((tr) => (
                                                <span key={tr.locale} className="rounded bg-muted px-1.5 py-0.5 text-xs uppercase">{tr.locale}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(bcp47) : "—"}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
