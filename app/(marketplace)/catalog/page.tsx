// app/(marketplace)/catalog/page.tsx
import { Suspense } from "react"
import { CatalogSidebar } from "@/components/marketplace/catalog-sidebar"
import { CatalogGrid } from "@/components/marketplace/catalog-grid"
import { CatalogSearch } from "@/components/marketplace/catalog-search"
import { CatalogStats } from "@/components/marketplace/catalog-stats"

export const metadata = {
    title: "Catálogo de Listas | LeadStore",
    description: "Explore nosso catálogo de listas de leads qualificados para comércio exterior.",
}

export default function CatalogPage() {
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
                    <Suspense fallback={<div className="h-10 bg-white/10 rounded-full animate-pulse" />}>
                        <CatalogSearch />
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
                    <Suspense fallback={<div className="space-y-4"><div className="h-40 bg-gray-100 rounded-lg animate-pulse"/></div>}>
                        <CatalogSidebar />
                    </Suspense>
                </aside>

                {/* Grid Principal */}
                <main className="flex-1 p-6">
                    {/* Stats Cards */}
                    <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse mb-6"/>}>
                        <CatalogStats />
                    </Suspense>

                    {/* Título + Grid */}
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Listas Disponíveis</h2>
                    <Suspense fallback={<CatalogGridSkeleton />}>
                        <CatalogGrid />
                    </Suspense>
                </main>
            </div>
        </div>
    )
}

function CatalogGridSkeleton() {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />
            ))}
        </div>
    )
}