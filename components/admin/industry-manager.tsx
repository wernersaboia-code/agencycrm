// components/admin/industry-manager.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    apagarSetor,
    atualizarSetor,
    criarSetor,
    moverSetor,
    type SetorAdmin,
} from "@/actions/admin/industries"
import {
    IDIOMAS_DO_SETOR,
    SLUG_DO_SETOR,
    nomeDoSetor,
    sugerirSlug,
    type NomesDoSetor,
} from "@/lib/marketplace/setores"

const nomesVazios = (): NomesDoSetor => Object.fromEntries(IDIOMAS_DO_SETOR.map((idioma) => [idioma, ""]))

const nomesCompletos = (nomes: NomesDoSetor) => IDIOMAS_DO_SETOR.every((idioma) => nomes[idioma]?.trim())

/** Os sete campos de nome, um por idioma publicado. */
function CamposDeNome({
    prefixo,
    nomes,
    onChange,
    disabled,
}: {
    /** Distingue os campos de criação dos de edição: `id` repetido faz o rótulo focar o campo errado. */
    prefixo: string
    nomes: NomesDoSetor
    onChange: (idioma: string, valor: string) => void
    disabled?: boolean
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {IDIOMAS_DO_SETOR.map((idioma) => (
                <div key={idioma} className="space-y-1">
                    <Label htmlFor={`${prefixo}-${idioma}`} className="text-xs uppercase text-muted-foreground">
                        {idioma}
                    </Label>
                    <Input
                        id={`${prefixo}-${idioma}`}
                        value={nomes[idioma] ?? ""}
                        maxLength={80}
                        disabled={disabled}
                        onChange={(e) => onChange(idioma, e.target.value)}
                    />
                </div>
            ))}
        </div>
    )
}

export function IndustryManager({ setores }: { setores: SetorAdmin[] }) {
    const t = useTranslations("admin.industries")
    const locale = useLocale()
    const router = useRouter()
    const [pendente, startTransition] = useTransition()

    const [slug, setSlug] = useState("")
    // Enquanto o admin não mexe no slug, ele acompanha o nome em inglês.
    const [slugEditado, setSlugEditado] = useState(false)
    const [nomesNovos, setNomesNovos] = useState<NomesDoSetor>(nomesVazios)

    const [editando, setEditando] = useState<string | null>(null)
    const [nomesEditados, setNomesEditados] = useState<NomesDoSetor>({})

    /** Roda a action e mostra o erro que ela devolve, sem lançar. */
    const executar = (
        acao: () => Promise<{ success: true } | { success: false; error: string }>,
        sucesso: string,
        depois?: () => void
    ) => {
        startTransition(async () => {
            try {
                const resultado = await acao()
                if (!resultado.success) {
                    toast.error(resultado.error)
                    return
                }
                toast.success(sucesso)
                depois?.()
                router.refresh()
            } catch {
                toast.error(t("genericError"))
            }
        })
    }

    const criar = () => {
        if (!SLUG_DO_SETOR.test(slug) || !nomesCompletos(nomesNovos)) {
            toast.error(t("missingFields"))
            return
        }
        executar(() => criarSetor({ id: slug, labels: nomesNovos }), t("created"), () => {
            setSlug("")
            setSlugEditado(false)
            setNomesNovos(nomesVazios())
        })
    }

    const salvar = (id: string) => {
        if (!nomesCompletos(nomesEditados)) {
            toast.error(t("missingFields"))
            return
        }
        executar(() => atualizarSetor(id, { labels: nomesEditados }), t("saved"), () => setEditando(null))
    }

    const apagar = (setor: SetorAdmin) => {
        if (!window.confirm(t("deleteConfirm", { name: nomeDoSetor(setor, setor.id, locale) }))) return
        executar(() => apagarSetor(setor.id), t("deleted"))
    }

    return (
        <div className="space-y-8">
            <section className="space-y-4 rounded-lg border bg-card p-4">
                <h2 className="font-semibold">{t("newIndustry")}</h2>

                <div className="space-y-1">
                    <Label className="text-sm">{t("namesLabel")}</Label>
                    <CamposDeNome
                        prefixo="novo"
                        nomes={nomesNovos}
                        disabled={pendente}
                        onChange={(idioma, valor) => {
                            setNomesNovos((atual) => ({ ...atual, [idioma]: valor }))
                            if (idioma === "en" && !slugEditado) setSlug(sugerirSlug(valor))
                        }}
                    />
                </div>

                <div className="max-w-sm space-y-1">
                    <Label htmlFor="slug-setor" className="text-sm">{t("slugLabel")}</Label>
                    <Input
                        id="slug-setor"
                        value={slug}
                        maxLength={60}
                        disabled={pendente}
                        className="font-mono"
                        onChange={(e) => {
                            setSlugEditado(true)
                            setSlug(e.target.value.toLowerCase())
                        }}
                    />
                    <p className="text-xs text-muted-foreground">{t("slugHelp")}</p>
                </div>

                <Button onClick={criar} disabled={pendente}>
                    <Plus className="h-4 w-4" /> {t("create")}
                </Button>
            </section>

            <section className="divide-y rounded-lg border bg-card">
                {setores.length === 0 && <p className="p-4 text-muted-foreground">{t("empty")}</p>}
                {setores.map((setor, indice) => (
                    <div key={setor.id} className="space-y-3 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                                <span className="font-medium">{nomeDoSetor(setor, setor.id, locale)}</span>
                                <span className="ml-2 font-mono text-xs text-muted-foreground">{setor.id}</span>
                                <Badge variant="secondary" className="ml-2 text-xs">
                                    {t("usage", { count: setor.listas })}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("moveUp")}
                                    title={t("moveUp")}
                                    disabled={pendente || indice === 0}
                                    onClick={() => executar(() => moverSetor(setor.id, "up"), t("saved"))}
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("moveDown")}
                                    title={t("moveDown")}
                                    disabled={pendente || indice === setores.length - 1}
                                    onClick={() => executar(() => moverSetor(setor.id, "down"), t("saved"))}
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("edit")}
                                    title={t("edit")}
                                    disabled={pendente}
                                    onClick={() => {
                                        setEditando(setor.id)
                                        setNomesEditados({ ...nomesVazios(), ...setor.labels })
                                    }}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("delete")}
                                    title={setor.listas > 0 ? t("deleteBlocked") : t("delete")}
                                    disabled={pendente || setor.listas > 0}
                                    onClick={() => apagar(setor)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            </div>
                        </div>

                        {editando === setor.id && (
                            <div className="space-y-3 rounded-md bg-muted/50 p-3">
                                <CamposDeNome
                                    prefixo={`editar-${setor.id}`}
                                    nomes={nomesEditados}
                                    disabled={pendente}
                                    onChange={(idioma, valor) =>
                                        setNomesEditados((atual) => ({ ...atual, [idioma]: valor }))
                                    }
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => salvar(setor.id)} disabled={pendente}>
                                        {t("save")}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditando(null)} disabled={pendente}>
                                        {t("cancel")}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </section>
        </div>
    )
}
