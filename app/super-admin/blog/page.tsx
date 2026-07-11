// app/super-admin/blog/page.tsx
import Link from "next/link"
import { Plus, Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { listPostsAdmin } from "@/actions/admin/blog"

export const dynamic = "force-dynamic"

export default async function AdminBlogPage() {
    const posts = await listPostsAdmin()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Blog</h1>
                    <p className="text-muted-foreground">Gerencie os artigos do blog nos 8 idiomas.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/super-admin/blog/categories"><Tags className="h-4 w-4" /> Categorias</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/super-admin/blog/new"><Plus className="h-4 w-4" /> Novo post</Link>
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-left">
                        <tr>
                            <th className="p-3">Título</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3">Idiomas</th>
                            <th className="p-3">Publicado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.length === 0 && (
                            <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum post ainda.</td></tr>
                        )}
                        {posts.map((post) => {
                            const title = post.translations.find((t) => t.locale === "pt")?.title
                                ?? post.translations[0]?.title ?? "(sem título)"
                            const categoryName = post.category?.translations.find((t) => t.locale === "pt")?.name
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
                                            {post.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                                        </Badge>
                                    </td>
                                    <td className="p-3">{categoryName}</td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-1">
                                            {post.translations.map((t) => (
                                                <span key={t.locale} className="rounded bg-muted px-1.5 py-0.5 text-xs uppercase">{t.locale}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("pt-BR") : "—"}
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
