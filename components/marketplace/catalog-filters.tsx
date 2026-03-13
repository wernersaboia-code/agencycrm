// components/marketplace/catalog-filters.tsx
"use client"

import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function CatalogFilters() {
    return (
        <div className="flex gap-2">
            <Select>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="DE">Alemanha</SelectItem>
                    <SelectItem value="FR">França</SelectItem>
                    <SelectItem value="IT">Itália</SelectItem>
                    <SelectItem value="US">EUA</SelectItem>
                </SelectContent>
            </Select>

            <Select>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Setor" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="food">Alimentos</SelectItem>
                    <SelectItem value="tech">Tecnologia</SelectItem>
                    <SelectItem value="fashion">Moda</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}