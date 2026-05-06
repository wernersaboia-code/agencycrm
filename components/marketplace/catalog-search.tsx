"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface CatalogSearchProps {
    defaultValue?: string
    variant?: "light" | "dark"
}

export function CatalogSearch({ defaultValue = "", variant = "light" }: CatalogSearchProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState(defaultValue)
    const isDark = variant === "dark"

    const handleSearch = (e: FormEvent) => {
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
            <Search
                className={cn(
                    "absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2",
                    isDark ? "text-white/70" : "text-muted-foreground"
                )}
            />
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, país, setor ou descrição"
                className={cn(
                    "h-11 rounded-md pl-12",
                    isDark
                        ? "border-white/20 bg-white/10 text-white placeholder:text-white/70 focus:bg-white/20 focus:border-white/40"
                        : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-500"
                )}
            />
        </form>
    )
}
