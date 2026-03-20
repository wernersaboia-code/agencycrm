// components/marketplace/catalog-grid.tsx
import { prisma } from "@/lib/prisma"
import { ListCard } from "./list-card"

export async function CatalogGrid() {
    const lists = await prisma.leadList.findMany({
        where: { isActive: true },
        orderBy: [
            { isFeatured: 'desc' },
            { createdAt: 'desc' }
        ],
    })

    if (lists.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500">
                    Nenhuma lista disponível no momento.
                </p>
            </div>
        )
    }

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((list) => (
                <ListCard
                    key={list.id}
                    list={{
                        ...list,
                        price: Number(list.price), // ← Converter Decimal pra Number
                    }}
                />
            ))}
        </div>
    )
}