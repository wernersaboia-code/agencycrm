// app/super-admin/blog/categories/page.tsx
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listCategoriesAdmin } from "@/actions/admin/blog"
import { CategoryManager } from "@/components/admin/blog/category-manager"

export const dynamic = "force-dynamic"

export default async function BlogCategoriesPage() {
    const categories = await listCategoriesAdmin()
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Categorias do blog</h1>
                <Button variant="outline" asChild>
                    <Link href="/super-admin/blog"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
                </Button>
            </div>
            <CategoryManager initial={categories.map((c) => ({
                id: c.id, key: c.key,
                translations: c.translations.map((t) => ({ locale: t.locale, name: t.name })),
                _count: c._count,
            }))} />
        </div>
    )
}
