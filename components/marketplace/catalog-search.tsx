// components/marketplace/catalog-search.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function CatalogSearch() {
    return (
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
            <Input
                placeholder="Search by Company Name or Product Key"
                className="pl-12 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/70 rounded-full focus:bg-white/20 focus:border-white/40"
            />
        </div>
    )
}