// components/admin/blog/post-editor.tsx
"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor/rich-text-editor"
import { BLOG_LOCALES, dirForLocale, type BlogLocale } from "@/lib/blog/locales"
import { slugify } from "@/lib/blog/slug"
import { uploadBlogImage } from "@/lib/blog/storage"
import { createPost, updatePost } from "@/actions/admin/blog"

type TranslationState = {
    title: string; slug: string; excerpt: string; contentHtml: string; metaDescription: string
}
const EMPTY: TranslationState = { title: "", slug: "", excerpt: "", contentHtml: "", metaDescription: "" }

// Converte um ISO/UTC para o formato de <input type="datetime-local"> no fuso
// LOCAL do navegador (YYYY-MM-DDTHH:mm). Precisa rodar no cliente.
function toDatetimeLocalValue(iso: string): string {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export type PostEditorInitial = {
    id?: string
    coverImageUrl: string | null
    categoryId: string | null
    status: "DRAFT" | "PUBLISHED"
    publishedAt: string | null
    translations: Partial<Record<BlogLocale, TranslationState>>
}

export function PostEditor({
    initial,
    categories,
}: {
    initial: PostEditorInitial
    categories: { id: string; name: string }[]
}) {
    const t = useTranslations("admin.blogEditor")
    const router = useRouter()
    const [cover, setCover] = useState(initial.coverImageUrl)
    const [categoryId, setCategoryId] = useState(initial.categoryId ?? "")
    const [status, setStatus] = useState(initial.status)
    const [publishedAt, setPublishedAt] = useState("")
    const [active, setActive] = useState<BlogLocale>("pt")
    const [tr, setTr] = useState<Partial<Record<BlogLocale, TranslationState>>>(initial.translations)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (initial.publishedAt) {
            setPublishedAt(toDatetimeLocalValue(initial.publishedAt))
        }
        // Só na montagem: converte o valor persistido para o fuso local do navegador.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const current = tr[active] ?? EMPTY
    const setField = (field: keyof TranslationState, value: string) =>
        setTr((prev) => ({ ...prev, [active]: { ...(prev[active] ?? EMPTY), [field]: value } }))

    const onTitleBlur = () => {
        if (current.title && !current.slug) setField("slug", slugify(current.title))
    }

    const onUpload = async (file: File) => {
        const res = await uploadBlogImage(file)
        if (res.success && res.url) { setCover(res.url); toast.success(t("coverSent")) }
        else toast.error(res.error ?? t("coverFailed"))
    }

    const handleSave = async () => {
        const translations = BLOG_LOCALES
            .map((l) => ({ locale: l, ...(tr[l] ?? EMPTY) }))
            .filter((t) => t.title.trim() || t.contentHtml.trim())
            .map((t) => ({
                locale: t.locale,
                title: t.title.trim(),
                slug: (t.slug.trim() || slugify(t.title || t.locale)),
                excerpt: t.excerpt.trim(),
                contentHtml: t.contentHtml,
                metaDescription: t.metaDescription.trim() || undefined,
            }))

        const payload = {
            coverImageUrl: cover ?? undefined,
            categoryId: categoryId || undefined,
            status,
            publishedAt: publishedAt ? new Date(publishedAt) : undefined,
            translations,
        }

        setSaving(true)
        try {
            if (initial.id) { await updatePost(initial.id, payload); toast.success(t("postUpdated")) }
            else { const id = await createPost(payload); toast.success(t("postCreated")); router.push(`/super-admin/blog/${id}`) }
            router.refresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : t("saveError"))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Núcleo */}
            <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>{t("category")}</Label>
                    <select className="h-10 w-full rounded-md border bg-background px-3"
                        value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="">{t("noCategory")}</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>{t("status")}</Label>
                    <select className="h-10 w-full rounded-md border bg-background px-3"
                        value={status} onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}>
                        <option value="DRAFT">{t("draft")}</option>
                        <option value="PUBLISHED">{t("published")}</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>{t("publishDate")}</Label>
                    <Input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>{t("cover")}</Label>
                    <Input type="file" accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
                    {cover && <img src={cover} alt="" className="mt-2 h-24 rounded object-cover" />}
                </div>
            </div>

            {/* Abas de idioma */}
            <div className="flex flex-wrap gap-1 border-b">
                {BLOG_LOCALES.map((l) => {
                    const filled = (tr[l]?.title?.trim() || tr[l]?.contentHtml?.trim())
                    return (
                        <button key={l} onClick={() => setActive(l)}
                            className={`px-3 py-2 text-sm uppercase ${active === l ? "border-b-2 border-primary font-semibold" : "text-muted-foreground"}`}>
                            {l}{filled ? " ●" : ""}
                        </button>
                    )
                })}
            </div>

            <div className="space-y-4" dir={dirForLocale(active)}>
                <div className="space-y-2">
                    <Label>{t("title")}</Label>
                    <Input value={current.title} onBlur={onTitleBlur} onChange={(e) => setField("title", e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>{t("slug")}</Label>
                    <Input value={current.slug} onChange={(e) => setField("slug", e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>{t("summary")}</Label>
                    <Input value={current.excerpt} onChange={(e) => setField("excerpt", e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>{t("content")}</Label>
                    <RichTextEditor content={current.contentHtml} onChange={(html) => setField("contentHtml", html)} />
                </div>
                <div className="space-y-2">
                    <Label>{t("metaDescription")}</Label>
                    <Input value={current.metaDescription} onChange={(e) => setField("metaDescription", e.target.value)} />
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>{saving ? t("saving") : t("save")}</Button>
            </div>
        </div>
    )
}
