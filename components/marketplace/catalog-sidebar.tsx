// components/marketplace/catalog-sidebar.tsx
"use client"

import { useId, useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "@/lib/i18n/navigation"
import { useTranslations } from "next-intl"
import { Check, ChevronDown } from "lucide-react"
import { FlagIcon } from "@/components/ui/flag-icon"

import {
    CATEGORY_IDS,
    COUNTRY_CODES,
    INDUSTRY_IDS,
    visibleFacets,
} from "@/lib/constants/catalog-facets"
import { LIST_LANGUAGES, LIST_LANGUAGE_CODES } from "@/lib/constants/list-languages"

interface CatalogSidebarProps {
    selectedCountries: string[]
    selectedIndustries: string[]
    selectedLanguages: string[]
    selectedCategory?: string
    countryCounts: Record<string, number>
    industryCounts: Record<string, number>
    languageCounts: Record<string, number>
    categoryCounts: Record<string, number>
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
                                   selectedCategory,
                                   countryCounts,
                                   industryCounts,
                                   languageCounts,
                                   categoryCounts,
                                   onNavigate,
                                   hideHeading = false,
                               }: CatalogSidebarProps) {
    const t = useTranslations("catalog")
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [countriesOpen, setCountriesOpen] = useState(true)
    const [industriesOpen, setIndustriesOpen] = useState(true)
    const [categoriesOpen, setCategoriesOpen] = useState(true)
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

    const selectCategory = (id: string) => {
        // Se clicar na mesma categoria, deseleciona
        updateFilters("category", selectedCategory === id ? undefined : id)
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
        selectedLanguages.length > 0 ||
        Boolean(selectedCategory)

    // O vocabulário é maior do que a operação: só entram no filtro as facetas
    // com lista publicada por trás (mais a que estiver selecionada). Uma seção
    // sem nenhuma faceta visível não é renderizada.
    const categorias = visibleFacets(
        CATEGORY_IDS,
        categoryCounts,
        selectedCategory ? [selectedCategory] : []
    )
    const paises = visibleFacets(COUNTRY_CODES, countryCounts, selectedCountries)
    const setores = visibleFacets(INDUSTRY_IDS, industryCounts, selectedIndustries)
    const idiomas = visibleFacets(LIST_LANGUAGE_CODES, languageCounts, selectedLanguages)

    return (
        <div className={`space-y-6 transition-opacity ${isPending ? "pointer-events-none opacity-60" : ""}`}>
            {!hideHeading && (
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{t("filtersTitle")}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("filtersSubtitle")}</p>
                </div>
            )}

            {/* Filtro de Categoria */}
            {categorias.length > 0 && (
            <div>
                <button
                    type="button"
                    onClick={() => setCategoriesOpen(!categoriesOpen)}
                    aria-expanded={categoriesOpen}
                    aria-controls={`${panelId}-categories`}
                    className="mb-3 flex w-full items-center justify-between text-left font-semibold text-foreground"
                >
                    <span>{t("filterCategory")}</span>
                    <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform ${categoriesOpen ? "rotate-180" : ""}`}
                    />
                </button>

                <div id={`${panelId}-categories`} hidden={!categoriesOpen}>
                    <div className="space-y-2">
                        {categorias.map((categoryId) => {
                            const count = categoryCounts[categoryId] || 0
                            const isDisabled = count === 0
                            const isSelected = selectedCategory === categoryId
                            const name = t(`categories.${categoryId}`)

                            return (
                                <button
                                    key={categoryId}
                                    type="button"
                                    onClick={() => selectCategory(categoryId)}
                                    disabled={isDisabled}
                                    aria-pressed={isSelected}
                                    className={`flex w-full items-center gap-3 rounded px-2 py-1.5 text-left transition-colors ${
                                        isDisabled
                                            ? "cursor-not-allowed opacity-40"
                                            : isSelected
                                                ? "bg-brand-accent/15 text-brand-accent-strong"
                                                : "hover:bg-muted"
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                            isSelected
                                                ? "border-brand-accent-strong bg-brand-accent-strong"
                                                : isDisabled
                                                    ? "border-border"
                                                    : "border-input"
                                        }`}
                                    >
                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                    </span>
                                    <span className="flex-1 text-sm text-muted-foreground">{name}</span>
                                    <span className="text-xs text-muted-foreground">({count})</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
            )}

            {categorias.length > 0 && paises.length > 0 && <hr className="border-border" />}

            {/* Filtro de Países */}
            {paises.length > 0 && (
            <div>
                <button
                    type="button"
                    onClick={() => setCountriesOpen(!countriesOpen)}
                    aria-expanded={countriesOpen}
                    aria-controls={`${panelId}-countries`}
                    className="mb-3 flex w-full items-center justify-between text-left font-semibold text-foreground"
                >
                    <span>{t("filterCountries")}</span>
                    <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform ${countriesOpen ? "rotate-180" : ""}`}
                    />
                </button>

                <div id={`${panelId}-countries`} hidden={!countriesOpen}>
                    <div className="space-y-2">
                        {paises.map((code) => {
                            const count = countryCounts[code] || 0
                            const isDisabled = count === 0
                            const isChecked = selectedCountries.includes(code)
                            const name = t(`countries.${code}`)

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
                                    <span className="flex-1 text-sm text-muted-foreground">{name}</span>
                                    <span className="text-xs text-muted-foreground">({count})</span>
                                </label>
                            )
                        })}
                    </div>
                </div>
            </div>
            )}

            {paises.length > 0 && setores.length > 0 && <hr className="border-border" />}

            {/* Filtro de Setores */}
            {setores.length > 0 && (
            <div>
                <button
                    type="button"
                    onClick={() => setIndustriesOpen(!industriesOpen)}
                    aria-expanded={industriesOpen}
                    aria-controls={`${panelId}-industries`}
                    className="mb-3 flex w-full items-center justify-between text-left font-semibold text-foreground"
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

            {setores.length > 0 && idiomas.length > 0 && <hr className="border-border" />}

            {/* Filtro de Idioma da lista */}
            {idiomas.length > 0 && (
            <div>
                <button
                    type="button"
                    onClick={() => setLanguagesOpen(!languagesOpen)}
                    aria-expanded={languagesOpen}
                    aria-controls={`${panelId}-languages`}
                    className="mb-3 flex w-full items-center justify-between text-left font-semibold text-foreground"
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
