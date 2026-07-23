"use client"

import { useTranslations } from "next-intl"
import { Building2, Filter, Globe, Layers3 } from "lucide-react"

interface CatalogStatsProps {
    total: number
    visibleCountryTotal: number
    activeFilterCount: number
    page: number
    pages: number
}

export function CatalogStats({
    total,
    visibleCountryTotal,
    activeFilterCount,
    page,
    pages,
}: CatalogStatsProps) {
    const t = useTranslations("catalog")
    const stats = [
        {
            icon: Building2,
            value: total.toLocaleString(),
            label: t("statListsFound"),
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            icon: Globe,
            value: visibleCountryTotal.toLocaleString(),
            label: t("statCountriesOnPage"),
            color: "text-indigo-600",
            bg: "bg-indigo-50",
        },
        {
            icon: Filter,
            value: activeFilterCount.toString(),
            label: t("statActiveFilters"),
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            icon: Layers3,
            value: `${page}/${Math.max(pages, 1)}`,
            label: t("statCurrentPage"),
            color: "text-violet-600",
            bg: "bg-violet-50",
        },
    ]

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-md ${stat.bg} ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xl font-bold text-foreground">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}
