import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RotateCcw, SearchX } from "lucide-react"
import { ListCard } from "./list-card"
import type { MarketplaceListCardData } from "./list-card"

interface CatalogGridProps {
    lists: MarketplaceListCardData[]
}

export function CatalogGrid({ lists }: CatalogGridProps) {
    if (lists.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-gray-100">
                    <SearchX className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Nenhuma lista combina com os filtros atuais
                </h3>
                <p className="mx-auto mb-6 max-w-md text-sm text-gray-500">
                    Remova alguns filtros ou busque por um mercado mais amplo para encontrar listas disponíveis.
                </p>
                <Button variant="outline" asChild>
                    <Link href="/catalog">
                        <RotateCcw className="h-4 w-4" />
                        Limpar filtros
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lists.map((list) => (
                <ListCard key={list.id} list={list} />
            ))}
        </div>
    )
}
