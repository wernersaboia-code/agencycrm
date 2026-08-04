// components/admin/lists-filter-bar.tsx
"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

/** Valor do <Select> para "sem filtro". String vazia é proibida pelo Radix. */
const TODOS = "__todos__"

interface ListsFilterBarProps {
    /** Só os países e setores que existem no catálogo — oferecer o vocabulário
     *  inteiro daria filtro que nunca devolve nada. */
    countries: string[]
    industries: string[]
    /** Quantas linhas a tabela mostra agora e quantas listas existem. */
    shown: number
    total: number
}

export function ListsFilterBar({ countries, industries, shown, total }: ListsFilterBarProps) {
    const t = useTranslations("admin.lists")
    // Os rótulos das facetas são os mesmos do catálogo público — o painel não
    // tem por que chamar a Alemanha de "DE" se o cliente a vê como "Alemanha".
    const tFacetas = useTranslations("catalog")
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    /**
     * Rótulo traduzido, com queda para o código cru.
     *
     * O formulário de lista aceita países em campo de texto livre, então o
     * banco pode conter um código fora do vocabulário. `t()` LANÇA quando a
     * chave não existe: sem esta guarda, um "XX" digitado por engano derrubaria
     * a página inteira de listas em vez de aparecer como uma opção esquisita.
     */
    const rotulo = (grupo: "countries" | "industries", id: string) => {
        const chave = `${grupo}.${id}`
        return tFacetas.has(chave) ? tFacetas(chave) : id
    }

    // Ordenar pelo rótulo, não pelo código: numa lista de nomes, "Alemanha"
    // vem antes de "Áustria" — ordenar por DE/AT deixaria o painel em ordem
    // que só faz sentido para quem pensa em ISO.
    const ordenarPorRotulo = (grupo: "countries" | "industries", ids: string[]) =>
        [...ids].sort((a, b) => rotulo(grupo, a).localeCompare(rotulo(grupo, b)))

    const q = searchParams.get("q") ?? ""
    const country = searchParams.get("country") ?? ""
    const industry = searchParams.get("industry") ?? ""
    const status = searchParams.get("status") ?? ""

    // A busca por texto é digitada, então o campo tem estado local e só empurra
    // para a URL depois da pausa. Navegar a cada tecla remontava a tabela
    // inteira no meio da palavra e roubava o foco do campo.
    const [texto, setTexto] = useState(q)
    useEffect(() => setTexto(q), [q])

    const aplicar = (chave: string, valor: string) => {
        const params = new URLSearchParams(searchParams)
        if (valor) {
            params.set(chave, valor)
        } else {
            params.delete(chave)
        }
        startTransition(() => {
            const query = params.toString()
            router.replace(query ? `?${query}` : "?")
        })
    }

    useEffect(() => {
        if (texto === q) return
        const timer = setTimeout(() => aplicar("q", texto.trim()), 300)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [texto])

    const temFiltro = Boolean(q || country || industry || status)

    const limpar = () => {
        setTexto("")
        startTransition(() => router.replace("?"))
    }

    return (
        <div className="space-y-3 rounded-lg border bg-card p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
                <div className="relative">
                    <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        aria-label={t("filtersSearchLabel")}
                        placeholder={t("filtersSearchPlaceholder")}
                        className="pl-9"
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                    />
                </div>

                <Select
                    value={country || TODOS}
                    onValueChange={(v) => aplicar("country", v === TODOS ? "" : v)}
                >
                    <SelectTrigger aria-label={t("colCountries")}>
                        <SelectValue placeholder={t("colCountries")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={TODOS}>{t("filtersAllCountries")}</SelectItem>
                        {ordenarPorRotulo("countries", countries).map((code) => (
                            <SelectItem key={code} value={code}>
                                {rotulo("countries", code)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={industry || TODOS}
                    onValueChange={(v) => aplicar("industry", v === TODOS ? "" : v)}
                >
                    <SelectTrigger aria-label={t("colIndustries")}>
                        <SelectValue placeholder={t("colIndustries")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={TODOS}>{t("filtersAllIndustries")}</SelectItem>
                        {ordenarPorRotulo("industries", industries).map((id) => (
                            <SelectItem key={id} value={id}>
                                {rotulo("industries", id)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={status || TODOS}
                    onValueChange={(v) => aplicar("status", v === TODOS ? "" : v)}
                >
                    <SelectTrigger aria-label={t("colStatus")}>
                        <SelectValue placeholder={t("colStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={TODOS}>{t("filtersAllStatus")}</SelectItem>
                        <SelectItem value="active">{t("active")}</SelectItem>
                        <SelectItem value="inactive">{t("filtersInactive")}</SelectItem>
                        <SelectItem value="noPdf">{t("noPdf")}</SelectItem>
                        <SelectItem value="featured">{t("featured")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between gap-3">
                <p className={`text-sm text-muted-foreground ${isPending ? "opacity-60" : ""}`}>
                    {t("filtersResult", { shown, total })}
                </p>
                {temFiltro && (
                    <Button variant="ghost" size="sm" onClick={limpar}>
                        <X className="h-4 w-4" />
                        {t("filtersClear")}
                    </Button>
                )}
            </div>
        </div>
    )
}
