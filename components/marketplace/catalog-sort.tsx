// components/marketplace/catalog-sort.tsx
"use client"

import { useId, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useRouter } from "@/lib/i18n/navigation"
import { ORDENACAO_PADRAO, ORDENACOES, type Ordenacao } from "@/lib/marketplace/ordenacao-catalogo"

/**
 * Seletor de ordenação do catálogo.
 *
 * `<select>` nativo de propósito: no celular abre o seletor do sistema, e a
 * lista tem quatro opções. A ordenação padrão não vai para a URL, para o
 * endereço limpo do catálogo continuar sendo um só.
 */
export function CatalogSort({ value }: { value: Ordenacao }) {
    const t = useTranslations("catalog")
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const id = useId()

    const rotulos: Record<Ordenacao, string> = {
        featured: t("featured"),
        recent: t("sortRecent"),
        country: t("sortCountry"),
        industry: t("sortIndustry"),
    }

    const trocar = (proxima: string) => {
        const params = new URLSearchParams(searchParams)
        if (proxima === ORDENACAO_PADRAO) params.delete("sort")
        else params.set("sort", proxima)
        params.delete("page")

        const query = params.toString()
        startTransition(() => {
            router.push(query ? `/catalog?${query}` : "/catalog")
        })
    }

    return (
        <div className={`flex items-center gap-2 transition-opacity ${isPending ? "opacity-60" : ""}`}>
            <label htmlFor={id} className="shrink-0 text-sm text-muted-foreground">
                {t("sortLabel")}
            </label>
            <select
                id={id}
                value={value}
                onChange={(e) => trocar(e.target.value)}
                disabled={isPending}
                className="h-9 rounded-md border border-input bg-card px-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                {ORDENACOES.map((ordenacao) => (
                    <option key={ordenacao} value={ordenacao}>
                        {rotulos[ordenacao]}
                    </option>
                ))}
            </select>
        </div>
    )
}
