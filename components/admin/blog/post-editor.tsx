// components/admin/blog/post-editor.tsx
"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PreviewButton } from "@/components/admin/blog/preview-button"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor/rich-text-editor"
import { BLOG_LOCALES, dirForLocale, type BlogLocale } from "@/lib/blog/locales"
import { slugify } from "@/lib/blog/slug"
import { uploadBlogImage } from "@/lib/blog/storage"
import { createPost, updatePost, type BlogFieldError } from "@/actions/admin/blog"
import { LIMITES_DE_POST } from "@/lib/validations/blog"
import { temAlteracaoNaoSalva as calcularAlteracaoNaoSalva, toDatetimeLocalValue } from "@/lib/blog/unsaved-changes"

/**
 * Contador ao vivo do campo. Existe porque o editor não tinha nenhum: o
 * primeiro post do blog falhou com um resumo acima do limite e o autor só
 * descobriu ao salvar, com uma mensagem opaca. O número vem de
 * LIMITES_DE_POST, o mesmo que o schema cobra — contador que discorda da
 * validação é pior que contador nenhum.
 *
 * Não usamos `maxLength` no input: truncar um texto colado sem avisar perde o
 * fim do trabalho de alguém em silêncio.
 */
/**
 * Nome do campo do schema para o rótulo que o autor vê na tela.
 *
 * Mapa explícito, e não `t(\`field_${campo}\`)`: chave montada em tempo de
 * execução some do grep e, se o Zod reclamar de um campo sem rótulo
 * cadastrado, o autor veria o caminho cru da chave em vez do nome. Campo
 * desconhecido cai no próprio id, que é feio mas legível.
 */
function rotuloDoCampo(campo: string, t: (chave: string) => string): string {
    const rotulos: Record<string, string> = {
        title: t("title"),
        slug: t("slug"),
        excerpt: t("summary"),
        contentHtml: t("content"),
        metaDescription: t("metaDescription"),
        categoryId: t("category"),
    }

    return rotulos[campo] ?? campo
}

function ContadorDeCaracteres({ valor, limite }: { valor: string; limite: number }) {
    const excedeu = valor.trim().length > limite

    return (
        <p
            className={`text-xs tabular-nums ${excedeu ? "font-medium text-destructive" : "text-muted-foreground"}`}
            aria-live="polite"
        >
            {valor.trim().length}/{limite}
        </p>
    )
}

type TranslationState = {
    title: string; slug: string; excerpt: string; contentHtml: string; metaDescription: string
}
const EMPTY: TranslationState = { title: "", slug: "", excerpt: "", contentHtml: "", metaDescription: "" }

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
    const [erros, setErros] = useState<BlogFieldError[]>([])

    useEffect(() => {
        if (initial.publishedAt) {
            setPublishedAt(toDatetimeLocalValue(initial.publishedAt))
        }
        // Só na montagem: converte o valor persistido para o fuso local do navegador.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const current = tr[active] ?? EMPTY

    // Comparação contra o que veio do servidor. Serialização basta: os dois
    // lados são objetos simples de string, montados pelo mesmo código.
    //
    // publishedAt é o campo delicado: o estado guarda o valor no formato de
    // <input type="datetime-local"> (fuso LOCAL), enquanto initial.publishedAt
    // é o ISO/UTC persistido — comparar direto daria falso positivo sempre,
    // já que os dois formatos nunca são iguais. calcularAlteracaoNaoSalva
    // converte o lado do servidor com a mesma função que o efeito de
    // montagem usa (toDatetimeLocalValue) antes de comparar.
    const temAlteracaoNaoSalva = calcularAlteracaoNaoSalva({
        tr,
        initialTranslations: initial.translations,
        cover,
        initialCoverImageUrl: initial.coverImageUrl,
        categoryId,
        initialCategoryId: initial.categoryId,
        status,
        initialStatus: initial.status,
        publishedAt,
        initialPublishedAt: initial.publishedAt,
    })

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
        setErros([])
        try {
            const res = initial.id
                ? await updatePost(initial.id, payload)
                : await createPost(payload)

            if (!res.success) {
                // Erro de validação volta como RESULTADO, não como exceção: em
                // produção o Next.js redige a mensagem de exceção de Server
                // Action e o autor via só "ocorreu um erro" + digest.
                setErros(res.fieldErrors ?? [])
                toast.error(res.error === "notPublishable" ? t("notPublishable") : t("validationFailed"))
                return
            }

            if ("id" in res) {
                toast.success(t("postCreated"))
                router.push(`/super-admin/blog/${res.id}`)
            } else {
                toast.success(t("postUpdated"))
            }
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
                    <div className="flex items-baseline justify-between gap-2">
                        <Label>{t("summary")}</Label>
                        <ContadorDeCaracteres valor={current.excerpt} limite={LIMITES_DE_POST.excerpt} />
                    </div>
                    <Input value={current.excerpt} onChange={(e) => setField("excerpt", e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>{t("content")}</Label>
                    <RichTextEditor
                        content={current.contentHtml}
                        onChange={(html) => setField("contentHtml", html)}
                        preset="article"
                        placeholder="Cole ou escreva o texto do post..."
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                        <Label>{t("metaDescription")}</Label>
                        <ContadorDeCaracteres valor={current.metaDescription} limite={LIMITES_DE_POST.metaDescription} />
                    </div>
                    <Input value={current.metaDescription} onChange={(e) => setField("metaDescription", e.target.value)} />
                    <p className="text-xs text-muted-foreground">{t("metaDescriptionHint")}</p>
                </div>
            </div>

            {erros.length > 0 && (
                <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                    <p className="font-medium text-destructive">{t("validationFailed")}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive/90">
                        {erros.map((erro, i) => (
                            <li key={`${erro.campo}-${erro.locale ?? "geral"}-${i}`}>
                                {erro.locale ? `[${erro.locale.toUpperCase()}] ` : ""}
                                {rotuloDoCampo(erro.campo, t)}
                                {erro.codigo === "too_big" && erro.limite !== undefined
                                    ? ` — ${t("tooBig", { limite: erro.limite })}`
                                    : ` — ${t("invalidField")}`}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex justify-end gap-2">
                <PreviewButton
                    postId={initial.id}
                    locale={active}
                    temAlteracaoNaoSalva={temAlteracaoNaoSalva}
                />
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? t("saving") : t("save")}
                </Button>
            </div>
        </div>
    )
}
