// components/marketplace/catalog-sidebar.tsx
"use client"

import { useState } from "react"
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

export function CatalogSidebar() {
    const [selectedCountries, setSelectedCountries] = useState<string[]>([])
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
    const [countriesOpen, setCountriesOpen] = useState(true)
    const [industriesOpen, setIndustriesOpen] = useState(true)

    const toggleCountry = (code: string) => {
        setSelectedCountries(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        )
    }

    const toggleIndustry = (id: string) => {
        setSelectedIndustries(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    return (
        <div className="space-y-6">
            {/* Filtro de Países */}
            <div>
                <button
                    onClick={() => setCountriesOpen(!countriesOpen)}
                    className="flex items-center justify-between w-full text-left font-semibold text-gray-700 mb-3"
                >
                    <span>Países</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${countriesOpen ? 'rotate-180' : ''}`} />
                </button>

                {countriesOpen && (
                    <div className="space-y-2">
                        {COUNTRIES.map((country) => (
                            <label
                                key={country.code}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    selectedCountries.includes(country.code)
                                        ? 'border-[#2ec4b6] bg-[#2ec4b6]'
                                        : 'border-gray-300 group-hover:border-[#2ec4b6]'
                                }`}>
                                    {selectedCountries.includes(country.code) && (
                                        <Check className="h-3 w-3 text-white" />
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedCountries.includes(country.code)}
                                    onChange={() => toggleCountry(country.code)}
                                />
                                <FlagIcon code={country.code} size="sm" />
                                <span className="text-sm text-gray-600">{country.name}</span>
                            </label>
                        ))}
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
                    <ChevronDown className={`h-4 w-4 transition-transform ${industriesOpen ? 'rotate-180' : ''}`} />
                </button>

                {industriesOpen && (
                    <div className="space-y-2">
                        {INDUSTRIES.map((industry) => (
                            <label
                                key={industry.id}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    selectedIndustries.includes(industry.id)
                                        ? 'border-[#2ec4b6] bg-[#2ec4b6]'
                                        : 'border-gray-300 group-hover:border-[#2ec4b6]'
                                }`}>
                                    {selectedIndustries.includes(industry.id) && (
                                        <Check className="h-3 w-3 text-white" />
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedIndustries.includes(industry.id)}
                                    onChange={() => toggleIndustry(industry.id)}
                                />
                                <span className="text-sm text-gray-600">{industry.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Botão de Limpar Filtros */}
            {(selectedCountries.length > 0 || selectedIndustries.length > 0) && (
                <button
                    onClick={() => {
                        setSelectedCountries([])
                        setSelectedIndustries([])
                    }}
                    className="w-full py-2 text-sm text-[#4a2c5a] hover:bg-purple-50 rounded-lg transition-colors"
                >
                    Limpar Filtros
                </button>
            )}
        </div>
    )
}