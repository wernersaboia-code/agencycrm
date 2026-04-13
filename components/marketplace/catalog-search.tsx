// components/marketplace/catalog-search.tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface CatalogSearchProps {
    defaultValue?: string
}

export function CatalogSearch({ defaultValue = "" }: CatalogSearchProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState(defaultValue)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams(searchParams)
        if (query.trim()) {
            params.set("search", query.trim())
        } else {
            params.delete("search")
        }
        params.delete("page")
        router.push(`/catalog?${params.toString()}`)
    }

    return (
        <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome ou descrição"
                className="pl-12 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/70 rounded-full focus:bg-white/20 focus:border-white/40"
            />
        </form>
    )
}