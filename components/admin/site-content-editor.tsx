"use client"

import { useMemo, useState, useTransition } from "react"
import { Check, Search, Send, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { saveSiteTextDraft, publishSiteText, type SiteTextField } from "@/actions/admin/site-content"
import type { EditableLocale } from "@/lib/site-content/config"

export function SiteContentEditor({ locale, fields }: { locale: EditableLocale; fields: SiteTextField[] }) {
    const [query, setQuery] = useState("")
    const [values, setValues] = useState<Record<string, string>>(() =>
        Object.fromEntries(fields.map((field) => [field.key, field.draftValue ?? field.publishedValue ?? field.originalValue]))
    )
    const [pendingKey, startTransition] = useTransition()

    const visibleFields = useMemo(() => {
        const normalized = query.toLocaleLowerCase()
        return fields.filter((field) =>
            !normalized || field.key.toLocaleLowerCase().includes(normalized) || values[field.key].toLocaleLowerCase().includes(normalized)
        )
    }, [fields, query, values])

    function save(field: SiteTextField, publish: boolean) {
        const value = values[field.key]
        if (!value.trim()) {
            toast.error("O texto não pode ficar vazio.")
            return
        }
        startTransition(async () => {
            try {
                const action = publish ? publishSiteText : saveSiteTextDraft
                await action({ locale, key: field.key, value })
                toast.success(publish ? "Texto publicado no site." : "Rascunho salvo.")
            } catch {
                toast.error("Não foi possível salvar o texto.")
            }
        })
    }

    return (
        <div className="space-y-5">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                Salvar mantém um rascunho privado. Publicar substitui imediatamente apenas este texto no site público. Layout, imagens e formatação não são alterados.
            </div>
            <div className="relative max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Buscar por página ou texto, ex.: hero, FAQ, privacidade" />
            </div>
            <p className="text-sm text-muted-foreground">{visibleFields.length} textos disponíveis para edição neste idioma.</p>
            <div className="space-y-4">
                {visibleFields.map((field) => {
                    const changed = values[field.key] !== field.originalValue
                    return (
                        <section key={field.key} className="rounded-lg border bg-card p-4 shadow-sm">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <code className="text-xs font-medium text-muted-foreground">{field.key}</code>
                                {field.publishedValue !== null && <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Check className="h-3.5 w-3.5" />Publicado</span>}
                            </div>
                            <Textarea value={values[field.key]} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} rows={Math.min(8, Math.max(3, Math.ceil(values[field.key].length / 100)))} />
                            <div className="mt-3 flex justify-end gap-2">
                                <Button variant="outline" size="sm" disabled={pendingKey || !changed} onClick={() => save(field, false)}><Save className="mr-1.5 h-3.5 w-3.5" />Salvar rascunho</Button>
                                <Button size="sm" disabled={pendingKey || !changed} onClick={() => save(field, true)}><Send className="mr-1.5 h-3.5 w-3.5" />Publicar</Button>
                            </div>
                        </section>
                    )
                })}
            </div>
        </div>
    )
}
