// app/(marketplace)/catalog/page.tsx
import { Suspense } from "react"
import { CatalogSidebar } from "@/components/marketplace/catalog-sidebar"
import { CatalogGrid } from "@/components/marketplace/catalog-grid"
import { CatalogSearch } from "@/components/marketplace/catalog-search"
import { CatalogStats } from "@/components/marketplace/catalog-stats"
import { getMarketplaceLists, getFilterCounts } from "@/actions/marketplace"

export const metadata = {
    title: "Catálogo de Listas | LeadStore",
    description: "Explore nosso catálogo de listas de leads qualificados para comércio exterior.",
}

interface CatalogPageProps {
    searchParams: Promise<{
        countries?: string
        industries?: string
        category?: string // ← ADICIONAR
        search?: string
        page?: string
    }>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
    // ✅ AWAIT searchParams
    const params = await searchParams

    // Parse search params
    const countries = params.countries?.split(",").filter(Boolean) || []
    const industries = params.industries?.split(",").filter(Boolean) || []
    const category = params.category || undefined // ← ADICIONAR
    const search = params.search || ""
    const page = parseInt(params.page || "1")

    // Buscar listas filtradas
    const { lists, total, pages } = await getMarketplaceLists({
        countries,
        industries,
        category, // ← ADICIONAR
        search,
        page,
    })

    // Buscar contadores para sidebar
    const filterCounts = await getFilterCounts()

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Roxo */}
            <header className="bg-[#4a2c5a] h-16 flex items-center px-6">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">L</span>
                    </div>
                    <span className="text-white font-bold text-xl">LeadStore</span>
                </div>

                {/* Search Bar Central */}
                <div className="flex-1 max-w-xl mx-auto">
                    <Suspense fallback={<SearchSkeleton />}>
                        <CatalogSearch defaultValue={search} />
                    </Suspense>
                </div>

                {/* Ações Direita */}
                <div className="flex items-center gap-4 text-white">
                    <button className="hover:text-emerald-400 transition-colors">
                        <i className="fa-regular fa-bell"></i>
                    </button>
                    <button className="hover:text-emerald-400 transition-colors">
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    </button>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <div className="flex">
                {/* Sidebar de Filtros */}
                <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
                    <Suspense fallback={<SidebarSkeleton />}>
                        <CatalogSidebar
                            selectedCountries={countries}
                            selectedIndustries={industries}
                            selectedCategory={category} // ← ADICIONAR
                            countryCounts={filterCounts.countryCounts}
                            industryCounts={filterCounts.industryCounts}
                            categoryCounts={filterCounts.categoryCounts} // ← ADICIONAR
                        />
                    </Suspense>
                </aside>

                {/* Grid Principal */}
                <main className="flex-1 p-6">
                    {/* Stats Cards */}
                    <div className="mb-6">
                        <CatalogStats total={total} />
                    </div>

                    {/* Título + Resultados */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Listas Disponíveis ({total})
                        </h2>
                        {pages > 1 && (
                            <span className="text-sm text-gray-500">
                Página {page} de {pages}
              </span>
                        )}
                    </div>

                    {/* Grid */}
                    <CatalogGrid lists={lists} />

                    {/* Paginação */}
                    {pages > 1 && (
                        <div className="mt-6 flex justify-center gap-2">
                            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                                <a
                                    key={p}
                                    href={`/catalog?${new URLSearchParams({
                                        ...params,
                                        page: p.toString(),
                                    })}`}
                                    className={`px-4 py-2 rounded-lg transition-colors ${
                                        p === page
                                            ? "bg-[#4a2c5a] text-white"
                                            : "bg-white text-gray-700 hover:bg-purple-50"
                                    }`}
                                >
                                    {p}
                                </a>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

// Skeleton para Search
function SearchSkeleton() {
    return (
        <div className="h-11 bg-white/10 rounded-full animate-pulse" />
    )
}

// Skeleton para Sidebar
function SidebarSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
                ))}
            </div>
            <div className="h-8 bg-gray-100 rounded animate-pulse mt-6" />
            <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
                ))}
            </div>
        </div>
    )
}