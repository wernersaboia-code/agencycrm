// components/marketplace/catalog-stats.tsx
import { prisma } from "@/lib/prisma"
import { Building2, Users, CheckCircle, Globe } from "lucide-react"

export async function CatalogStats() {
    const [totalLists, totalLeads, totalCountries] = await Promise.all([
        prisma.leadList.count({ where: { isActive: true } }),
        prisma.leadList.aggregate({
            where: { isActive: true },
            _sum: { totalLeads: true }
        }),
        prisma.leadList.findMany({
            where: { isActive: true },
            select: { countries: true }
        }).then(lists => {
            const allCountries = lists.flatMap(l => l.countries)
            return new Set(allCountries).size
        })
    ])

    const stats = [
        {
            icon: Building2,
            value: totalLists.toLocaleString(),
            label: "Listas",
            color: "text-blue-500"
        },
        {
            icon: Users,
            value: Number(totalLeads._sum.totalLeads || 0).toLocaleString(),
            label: "Leads Totais",
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
            value: totalCountries.toString(),
            label: "Países",
            color: "text-purple-500"
        }
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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