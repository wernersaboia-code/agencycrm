// components/marketplace/catalog-sidebar.tsx
"use client"

import { useId, useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "@/lib/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Check, ChevronDown } from "lucide-react"
import { FlagIcon } from "@/components/ui/flag-icon"

import {
    INDUSTRY_IDS,
    secaoOfereceEscolha,
    visibleFacets,
} from "@/lib/constants/catalog-facets"
import { excecoesDoIdioma } from "@/lib/i18n/nome-de-pais"
import { facetasDePais } from "@/lib/marketplace/facetas-de-pais"
import { LIST_LANGUAGES, LIST_LANGUAGE_CODES } from "@/lib/constants/list-languages"

interface CatalogSidebarProps {
    selectedCountries: string[]
    selectedIndustries: string[]
    selectedLanguages: string[]
    countryCounts: Record<string, number>
    industryCounts: Record<string, number>
    languageCounts: Record<string, number>
    onNavigate?: () => void
    /** Dentro da gaveta mobile o título já vem do SheetHeader. */
    hideHeading?: boolean
}

/**
 * A caixa visual é um `<span>` decorativo; o `<input>` real fica em `sr-only`
 * (nunca `hidden`, que o tira da ordem de tabulação) e comanda a aparência via
 * `peer-*`. Assim o filtro continua operável por teclado e leitor de tela.
 */
function FilterCheckbox({ checked, disabled }: { checked: boolean; disabled: boolean }) {
    return (
        <span
            aria-hidden="true"
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ${
                checked
                    ? "border-brand-accent-strong bg-brand-accent-strong"
                    : disabled
                        ? "border-border"
                        : "border-input group-hover:border-brand-accent"
            }`}
        >
            {checked && <Check className="h-3 w-3 text-white" />}
        </span>
    )
}

export function CatalogSidebar({
                                   selectedCountries,
                                   selectedIndustries,
                                   selectedLanguages,
                                   countryCounts,
                                   industryCounts,
                                   languageCounts,
                                   onNavigate,
                                   hideHeading = false,
                               }: CatalogSidebarProps) {
    const t = useTranslations("catalog")
    const locale = useLocale()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [countriesOpen, setCountriesOpen] = useState(true)
    const [industriesOpen, setIndustriesOpen] = useState(true)
    const [languagesOpen, setLanguagesOpen] = useState(true)

    const panelId = useId()

    const updateFilters = (key: string, values: string[] | string | undefined) => {
        const params = new URLSearchParams(searchParams)

        if (Array.isArray(values)) {
            if (values.length > 0) {
                params.set(key, values.join(","))
            } else {
                params.delete(key)
            }
        } else if (values) {
            params.set(key, values)
        } else {
            params.delete(key)
        }

        params.delete("page")

        // Sem a transição a navegação do servidor não dá nenhum sinal de vida:
        // o usuário clica no filtro e a tela fica parada até a página chegar.
        startTransition(() => {
            router.push(`/catalog?${params.toString()}`)
        })
        onNavigate?.()
    }

    const toggleCountry = (code: string) => {
        const newCountries = selectedCountries.includes(code)
            ? selectedCountries.filter((c) => c !== code)
            : [...selectedCountries, code]
        updateFilters("countries", newCountries)
    }

    const toggleIndustry = (id: string) => {
        const newIndustries = selectedIndustries.includes(id)
            ? selectedIndustries.filter((i) => i !== id)
            : [...selectedIndustries, id]
        updateFilters("industries", newIndustries)
    }

    const toggleLanguage = (code: string) => {
        const newLanguages = selectedLanguages.includes(code)
            ? selectedLanguages.filter((l) => l !== code)
            : [...selectedLanguages, code]
        updateFilters("languages", newLanguages)
    }

    const clearFilters = () => {
        startTransition(() => {
            router.push("/catalog")
        })
        onNavigate?.()
    }

    const hasActiveFilters =
        selectedCountries.length > 0 ||
        selectedIndustries.length > 0 ||
        selectedLanguages.length > 0

    // País não é vocabulário nosso: a faceta sai do próprio catálogo e o nome
    // vem do ICU no idioma do visitante, então estudo de país novo aparece aqui
    // sem precisar de commit.
    const paises = facetasDePais(countryCounts, selectedCountries, locale, excecoesDoIdioma(locale))
    // Setor CONTINUA vocabulário curado — "HoReCa", "FMCG" e "snacks_bars" são
    // linguagem do negócio, não padrão internacional. Só entra no filtro o que
    // tem estudo por trás (mais o que estiver selecionado).
    const setores = visibleFacets(INDUSTRY_IDS, industryCounts, selectedIndustries)
    const idiomas = visibleFacets(LIST_LANGUAGE_CODES, languageCounts, selectedLanguages)

    // Uma faceta sozinha não filtra nada: marcar a única opção devolve o mesmo
    // catálogo. A exceção é filtro já ativo (link antigo), senão ele ficaria
    // aplicado sem aparecer em lugar nenhum para ser desmarcado.
    const mostrarPaises = secaoOfereceEscolha(paises, selectedCountries)
    const mostrarSetores = secaoOfereceEscolha(setores, selectedIndustries)
    const mostrarIdiomas = secaoOfereceEscolha(idiomas, selectedLanguages)

    return (
        <div className={`space-y-6 transition-opacity ${isPending ? "pointer-events-none opacity-60" : ""}`}>
            {!hideHeading && (
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{t("filtersTitle")}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("filtersSubtitle")}</p>
                </div>
            )}

            {/* Filtro de Países */}
            {mostrarPaises && (
            <div>
                <button
                    type="button"
                    onClick={() => setCountriesOpen(!countriesOpen)}
                    aria-expanded={countriesOpen}
                    aria-controls={`${panelId}-countries`}
                    className="mb-3 flex w-full items-center justify-between text-start font-semibold text-foreground"
                >
                    <span>{t("filterCountries")}</span>
                    <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform ${countriesOpen ? "rotate-180" : ""}`}
                    />
                </button>

                <div id={`${panelId}-countries`} hidden={!countriesOpen}>
                    <div className="space-y-2">
                        {paises.map(({ code, nome, count }) => {
                            const isDisabled = count === 0
                            const isChecked = selectedCountries.includes(code)

                            return (
                                <label
                                    key={code}
                                    className={`group flex items-center gap-3 ${
                                        isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={isChecked}
                                        onChange={() => toggleCountry(code)}
                                        disabled={isDisabled}
                                    />
                                    <FilterCheckbox checked={isChecked} disabled={isDisabled} />
                                    <FlagIcon code={code} size="sm" decorative />
                                    <span className="flex-1 text-sm text-muted-foreground">{nome}</span>
                                    <span className="text-xs text-muted-foreground">({count})</span>
                                </label>
                            )
                        })}
                    </div>
                </div>
            </div>
            )}

            {mostrarPaises && mostrarSetores && <hr className="border-border" />}

            {/* Filtro de Setores */}
            {mostrarSetores && (
            <div>
                <button
                    type="button"
                    onClick={() => setIndustriesOpen(!industriesOpen)}
                    aria-expanded={industriesOpen}
                    aria-controls={`${panelId}-industries`}
                    className="mb-3 flex w-full items-center justify-between text-start font-semibold text-foreground"
                >
                    <span>{t("filterIndustries")}</span>
                    <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform ${industriesOpen ? "rotate-180" : ""}`}
                    />
                </button>

                <div id={`${panelId}-industries`} hidden={!industriesOpen}>
                    <div className="space-y-2">
                        {setores.map((industryId) => {
                            const count = industryCounts[industryId] || 0
                            const isDisabled = count === 0
                            const isChecked = selectedIndustries.includes(industryId)
                            const name = t(`industries.${industryId}`)

                            return (
                                <label
                                    key={industryId}
                                    className={`group flex items-center gap-3 ${
                                        isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={isChecked}
                                        onChange={() => toggleIndustry(industryId)}
                                        disabled={isDisabled}
                                    />
                                    <FilterCheckbox checked={isChecked} disabled={isDisabled} />
                                    <span className="flex-1 text-sm text-muted-foreground">{name}</span>
                                    <span className="text-xs text-muted-foreground">({count})</span>
                                </label>
                            )
                        })}
                    </div>
                </div>
            </div>
            )}

            {mostrarSetores && mostrarIdiomas && <hr className="border-border" />}

            {/* Filtro de Idioma da lista */}
            {mostrarIdiomas && (
            <div>
                <button
                    type="button"
                    onClick={() => setLanguagesOpen(!languagesOpen)}
                    aria-expanded={languagesOpen}
                    aria-controls={`${panelId}-languages`}
                    className="mb-3 flex w-full items-center justify-between text-start font-semibold text-foreground"
                >
                    <span>{t("filterLanguages")}</span>
                    <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform ${languagesOpen ? "rotate-180" : ""}`}
                    />
                </button>

                <div id={`${panelId}-languages`} hidden={!languagesOpen}>
                    <div className="space-y-2">
                        {idiomas.map((code) => {
                            const count = languageCounts[code] || 0
                            const isDisabled = count === 0
                            const isChecked = selectedLanguages.includes(code)
                            // Nome do idioma na própria língua: "Deutsch", não
                            // "Alemão". Endônimo é o padrão em seletor de idioma
                            // e dispensa 7x7 traduções.
                            const name = LIST_LANGUAGES.find((l) => l.code === code)?.label ?? code

                            return (
                                <label
                                    key={code}
                                    className={`group flex items-center gap-3 ${
                                        isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={isChecked}
                                        onChange={() => toggleLanguage(code)}
                                        disabled={isDisabled}
                                    />
                                    <FilterCheckbox checked={isChecked} disabled={isDisabled} />
                                    <span className="flex-1 text-sm text-muted-foreground">{name}</span>
                                    <span className="text-xs text-muted-foreground">({count})</span>
                                </label>
                            )
                        })}
                    </div>
                </div>
            </div>
            )}

            {/* Botão de Limpar Filtros */}
            {hasActiveFilters && (
                <button
                    type="button"
                    onClick={clearFilters}
                    className="w-full rounded-md border border-border bg-card py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
                >
                    {t("clearFilters")}
                </button>
            )}
        </div>
    )
}
