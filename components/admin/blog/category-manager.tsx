// components/admin/blog/category-manager.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BLOG_LOCALES } from "@/lib/blog/locales"
import { createCategory, deleteCategory } from "@/actions/admin/blog"
import { slugify } from "@/lib/blog/slug"

type CategoryRow = {
    id: string
    key: string
    translations: { locale: string; name: string }[]
    _count: { posts: number }
}

export function CategoryManager({ initial }: { initial: CategoryRow[] }) {
    const router = useRouter()
    const [key, setKey] = useState("")
    const [names, setNames] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    const handleCreate = async () => {
        const translations = BLOG_LOCALES
            .filter((l) => names[l]?.trim())
            .map((l) => ({ locale: l, name: names[l].trim() }))
        if (!key.trim() || translations.length === 0) {
            toast.error("Informe a chave e ao menos um nome traduzido.")
            return
        }
        setSaving(true)
        try {
            await createCategory({ key: slugify(key), translations })
            toast.success("Categoria criada.")
            setKey(""); setNames({})
            router.refresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao criar categoria.")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory(id)
            toast.success("Categoria excluída.")
            router.refresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao excluir.")
        }
    }

    return (
        <div className="space-y-8">
            <div className="rounded-lg border p-4 space-y-4">
                <h2 className="font-semibold">Nova categoria</h2>
                <Input placeholder="chave (ex.: market-analysis)" value={key} onChange={(e) => setKey(e.target.value)} />
                <div className="grid gap-2 sm:grid-cols-2">
                    {BLOG_LOCALES.map((l) => (
                        <Input key={l} placeholder={`Nome (${l.toUpperCase()})`}
                            value={names[l] ?? ""} onChange={(e) => setNames((n) => ({ ...n, [l]: e.target.value }))} />
                    ))}
                </div>
                <Button onClick={handleCreate} disabled={saving}><Plus className="h-4 w-4" /> Criar</Button>
            </div>

            <div className="rounded-lg border divide-y">
                {initial.length === 0 && <p className="p-4 text-muted-foreground">Nenhuma categoria.</p>}
                {initial.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3">
                        <div>
                            <span className="font-medium">{c.translations.find((t) => t.locale === "pt")?.name ?? c.key}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{c.key} · {c._count.posts} post(s)</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} aria-label="Excluir">
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
