// components/marketplace/catalog-sidebar.tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronDown } from "lucide-react"
import { FlagIcon } from "@/components/ui/flag-icon"

const COUNTRIES = [
    { code: "DE", name: "Alemanha" },
    { code: "FR", name: "França" },
    { code: "IT", name: "Itália" },
    { code: "ES", name: "Espanha" },
    { code: "NL", name: "Holanda" },
    { code: "BE", name: "Bélgica" },
    { code: "PL", name: "Polônia" },
    { code: "SE", name: "Suécia" },
    { code: "AT", name: "Áustria" },
    { code: "CH", name: "Suíça" },
    { code: "PT", name: "Portugal" },
    { code: "GB", name: "Reino Unido" },
    { code: "US", name: "Estados Unidos" },
    { code: "CN", name: "China" },
    { code: "JP", name: "Japão" },
    { code: "BR", name: "Brasil" },
]

const INDUSTRIES = [
    { id: "food", name: "Alimentos & Bebidas" },
    { id: "tech", name: "Tecnologia" },
    { id: "fashion", name: "Moda & Têxtil" },
    { id: "automotive", name: "Automotivo" },
    { id: "health", name: "Saúde & Farmácia" },
    { id: "construction", name: "Construção" },
    { id: "retail", name: "Varejo" },
    { id: "industrial", name: "Industrial" },
]

const CATEGORIES = [
    { id: "importers", name: "Importadores" },
    { id: "exporters", name: "Exportadores" },
    { id: "manufacturers", name: "Fabricantes" },
    { id: "distributors", name: "Distribuidores" },
    { id: "retailers", name: "Varejistas" },
    { id: "wholesalers", name: "Atacadistas" },
]

interface CatalogSidebarProps {
    selectedCountries: string[]
    selectedIndustries: string[]
    selectedCategory?: string
    countryCounts: Record<string, number>
    industryCounts: Record<string, number>
    categoryCounts: Record<string, number>
}

export function CatalogSidebar({
                                   selectedCountries,
                                   selectedIndustries,
                                   selectedCategory,
                                   countryCounts,
                                   industryCounts,
                                   categoryCounts,
                               }: CatalogSidebarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [countriesOpen, setCountriesOpen] = useState(true)
    const [industriesOpen, setIndustriesOpen] = useState(true)
    const [categoriesOpen, setCategoriesOpen] = useState(true)

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

        params.delete("page") // Reset página ao filtrar
        router.push(`/catalog?${params.toString()}`)
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

    const selectCategory = (id: string) => {
        // Se clicar na mesma categoria, deseleciona
        updateFilters("category", selectedCategory === id ? undefined : id)
    }

    const clearFilters = () => {
        router.push("/catalog")
    }

    const hasActiveFilters =
        selectedCountries.length > 0 ||
        selectedIndustries.length > 0 ||
        selectedCategory

    return (
        <div className="space-y-6">
            {/* Filtro de Categoria */}
            <div>
                <button
                    onClick={() => setCategoriesOpen(!categoriesOpen)}
                    className="flex items-center justify-between w-full text-left font-semibold text-gray-700 mb-3"
                >
                    <span>Categoria</span>
                    <ChevronDown
                        className={`h-4 w-4 transition-transform ${categoriesOpen ? "rotate-180" : ""}`}
                    />
                </button>

                {categoriesOpen && (
                    <div className="space-y-2">
                        {CATEGORIES.map((category) => {
                            const count = categoryCounts[category.id] || 0
                            const isDisabled = count === 0
                            const isSelected = selectedCategory === category.id

                            return (
                                <button
                                    key={category.id}
                                    onClick={() => !isDisabled && selectCategory(category.id)}
                                    disabled={isDisabled}
                                    className={`flex items-center gap-3 w-full text-left px-2 py-1.5 rounded transition-colors ${
                                        isDisabled
                                            ? "opacity-40 cursor-not-allowed"
                                            : isSelected
                                                ? "bg-[#2ec4b6]/10 text-[#2ec4b6]"
                                                : "hover:bg-gray-100"
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                            isSelected
                                                ? "border-[#2ec4b6] bg-[#2ec4b6]"
                                                : isDisabled
                                                    ? "border-gray-200"
                                                    : "border-gray-300"
                                        }`}
                                    >
                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <span className="text-sm text-gray-600 flex-1">{category.name}</span>
                                    <span className="text-xs text-gray-400">({count})</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            <hr className="border-gray-200" />

            {/* Filtro de Países */}
            <div>
                <button
                    onClick={() => setCountriesOpen(!countriesOpen)}
                    className="flex items-center justify-between w-full text-left font-semibold text-gray-700 mb-3"
                >
                    <span>Países</span>
                    <ChevronDown
                        className={`h-4 w-4 transition-transform ${countriesOpen ? "rotate-180" : ""}`}
                    />
                </button>

                {countriesOpen && (
                    <div className="space-y-2">
                        {COUNTRIES.map((country) => {
                            const count = countryCounts[country.code] || 0
                            const isDisabled = count === 0

                            return (
                                <label
                                    key={country.code}
                                    className={`flex items-center gap-3 cursor-pointer group ${
                                        isDisabled ? "opacity-40 cursor-not-allowed" : ""
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                            selectedCountries.includes(country.code)
                                                ? "border-[#2ec4b6] bg-[#2ec4b6]"
                                                : isDisabled
                                                    ? "border-gray-200"
                                                    : "border-gray-300 group-hover:border-[#2ec4b6]"
                                        }`}
                                    >
                                        {selectedCountries.includes(country.code) && (
                                            <Check className="h-3 w-3 text-white" />
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedCountries.includes(country.code)}
                                        onChange={() => !isDisabled && toggleCountry(country.code)}
                                        disabled={isDisabled}
                                    />
                                    <FlagIcon code={country.code} size="sm" />
                                    <span className="text-sm text-gray-600 flex-1">{country.name}</span>
                                    <span className="text-xs text-gray-400">({count})</span>
                                </label>
                            )
                        })}
                    </div>
                )}
            </div>

            <hr className="border-gray-200" />

            {/* Filtro de Setores */}
            <div>
                <button
                    onClick={() => setIndustriesOpen(!industriesOpen)}
                    className="flex items-center justify-between w-full text-left font-semibold text-gray-700 mb-3"
                >
                    <span>Setores</span>
                    <ChevronDown
                        className={`h-4 w-4 transition-transform ${industriesOpen ? "rotate-180" : ""}`}
                    />
                </button>

                {industriesOpen && (
                    <div className="space-y-2">
                        {INDUSTRIES.map((industry) => {
                            const count = industryCounts[industry.id] || 0
                            const isDisabled = count === 0

                            return (
                                <label
                                    key={industry.id}
                                    className={`flex items-center gap-3 cursor-pointer group ${
                                        isDisabled ? "opacity-40 cursor-not-allowed" : ""
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                            selectedIndustries.includes(industry.id)
                                                ? "border-[#2ec4b6] bg-[#2ec4b6]"
                                                : isDisabled
                                                    ? "border-gray-200"
                                                    : "border-gray-300 group-hover:border-[#2ec4b6]"
                                        }`}
                                    >
                                        {selectedIndustries.includes(industry.id) && (
                                            <Check className="h-3 w-3 text-white" />
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedIndustries.includes(industry.id)}
                                        onChange={() => !isDisabled && toggleIndustry(industry.id)}
                                        disabled={isDisabled}
                                    />
                                    <span className="text-sm text-gray-600 flex-1">{industry.name}</span>
                                    <span className="text-xs text-gray-400">({count})</span>
                                </label>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Botão de Limpar Filtros */}
            {hasActiveFilters && (
                <button
                    onClick={clearFilters}
                    className="w-full py-2 text-sm text-[#4a2c5a] hover:bg-purple-50 rounded-lg transition-colors"
                >
                    Limpar Filtros
                </button>
            )}
        </div>
    )
}