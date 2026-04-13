// components/marketplace/catalog-grid.tsx
import { ListCard } from "./list-card"

interface CatalogGridProps {
    lists: any[]
}

export function CatalogGrid({ lists }: CatalogGridProps) {
    if (lists.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500">Nenhuma lista encontrada com esses filtros.</p>
            </div>
        )
    }

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((list) => (
                <ListCard key={list.id} list={list} />
            ))}
        </div>
    )
}