// app/(marketplace)/catalog/page.tsx
import { Suspense } from "react"
import { CatalogGrid } from "@/components/marketplace/catalog-grid"
import { CatalogFilters } from "@/components/marketplace/catalog-filters"
import { CatalogSearch } from "@/components/marketplace/catalog-search"

export const metadata = {
    title: "Catálogo de Listas | LeadStore",
    description: "Explore nosso catálogo de listas de leads qualificados para comércio exterior.",
}

export default function CatalogPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Catálogo de Listas</h1>
                <p className="text-muted-foreground">
                    Encontre leads qualificados para expandir seus negócios internacionais.
                </p>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
                <div className="flex-1">
                    <Suspense fallback={<div className="h-10 bg-muted animate-pulse rounded-md" />}>
                        <CatalogSearch />
                    </Suspense>
                </div>
                <Suspense fallback={<div className="h-10 w-64 bg-muted animate-pulse rounded-md" />}>
                    <CatalogFilters />
                </Suspense>
            </div>

            {/* Grid de Listas */}
            <Suspense fallback={<CatalogGridSkeleton />}>
                <CatalogGrid />
            </Suspense>
        </div>
    )
}

function CatalogGridSkeleton() {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="h-64 bg-muted animate-pulse rounded-lg"
                />
            ))}
        </div>
    )
}