// components/calls/CallFilters.tsx

"use client"

// ============================================
// IMPORTS
// ============================================
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
import { CALL_RESULT_CONFIG } from "@/lib/constants/call.constants"
import { CallResult } from "@prisma/client"

// ============================================
// TYPES
// ============================================

export interface CallFiltersState {
    search: string
    result: CallResult | "ALL"
    dateRange: "all" | "today" | "week" | "month" | "custom"
    dateFrom: string
    dateTo: string
}

interface CallFiltersProps {
    filters: CallFiltersState
    onFilterChange: (filters: Partial<CallFiltersState>) => void
}

// ============================================
// CONSTANTS
// ============================================

const DATE_RANGE_OPTIONS = [
    { value: "all", label: "Todas as datas" },
    { value: "today", label: "Hoje" },
    { value: "week", label: "Últimos 7 dias" },
    { value: "month", label: "Últimos 30 dias" },
    { value: "custom", label: "Personalizado" },
] as const

// ============================================
// COMPONENT
// ============================================

export function CallFilters({ filters, onFilterChange }: CallFiltersProps) {
    const hasActiveFilters =
        filters.search ||
        filters.result !== "ALL" ||
        filters.dateRange !== "all"

    const handleClearFilters = (): void => {
        onFilterChange({
            search: "",
            result: "ALL",
            dateRange: "all",
            dateFrom: "",
            dateTo: "",
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Busca */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por lead, empresa ou notas..."
                        value={filters.search}
                        onChange={(e) => onFilterChange({ search: e.target.value })}
                        className="pl-10"
                    />
                </div>

                {/* Resultado */}
                <Select
                    value={filters.result}
                    onValueChange={(value) =>
                        onFilterChange({ result: value as CallResult | "ALL" })
                    }
                >
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Resultado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos os resultados</SelectItem>
                        {Object.entries(CALL_RESULT_CONFIG).map(([value, config]) => (
                            <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                    <config.icon className={`h-4 w-4 ${config.color}`} />
                                    {config.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Data */}
                <Select
                    value={filters.dateRange}
                    onValueChange={(value) =>
                        onFilterChange({
                            dateRange: value as CallFiltersState["dateRange"],
                        })
                    }
                >
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                        {DATE_RANGE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Limpar filtros */}
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                    </Button>
                )}
            </div>

            {/* Datas customizadas */}
            {filters.dateRange === "custom" && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">De:</span>
                        <Input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
                            className="w-auto"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Até:</span>
                        <Input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => onFilterChange({ dateTo: e.target.value })}
                            className="w-auto"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}