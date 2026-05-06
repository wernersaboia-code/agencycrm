import { Building2, Filter, FileDown, Layers3 } from "lucide-react"

interface CatalogStatsProps {
    total: number
    visibleLeadTotal: number
    activeFilterCount: number
    page: number
    pages: number
}

export function CatalogStats({
    total,
    visibleLeadTotal,
    activeFilterCount,
    page,
    pages,
}: CatalogStatsProps) {
    const stats = [
        {
            icon: Building2,
            value: total.toLocaleString(),
            label: "Listas encontradas",
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            icon: FileDown,
            value: visibleLeadTotal.toLocaleString(),
            label: "Leads nesta página",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            icon: Filter,
            value: activeFilterCount.toString(),
            label: "Filtros ativos",
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            icon: Layers3,
            value: `${page}/${Math.max(pages, 1)}`,
            label: "Página atual",
            color: "text-violet-600",
            bg: "bg-violet-50",
        },
    ]

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-md ${stat.bg} ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}
