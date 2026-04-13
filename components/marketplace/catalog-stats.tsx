// components/marketplace/catalog-stats.tsx
import { Building2, Users, CheckCircle, Globe } from "lucide-react"

interface CatalogStatsProps {
    total: number
}

export function CatalogStats({ total }: CatalogStatsProps) {
    const stats = [
        {
            icon: Building2,
            value: total.toLocaleString(),
            label: "Listas Encontradas",
            color: "text-blue-500"
        },
        {
            icon: Users,
            value: "10k+",
            label: "Leads Disponíveis",
            color: "text-yellow-500"
        },
        {
            icon: CheckCircle,
            value: "85%+",
            label: "Verificados",
            color: "text-orange-500"
        },
        {
            icon: Globe,
            value: "16",
            label: "Países",
            color: "text-purple-500"
        }
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
                >
                    <div className={`w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}