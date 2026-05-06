import { Suspense } from "react"
import type { ComponentType } from "react"
import { CatalogSidebar } from "@/components/marketplace/catalog-sidebar"
import { CatalogGrid } from "@/components/marketplace/catalog-grid"
import { CatalogSearch } from "@/components/marketplace/catalog-search"
import { CatalogStats } from "@/components/marketplace/catalog-stats"
import { getMarketplaceLists, getFilterCounts } from "@/actions/marketplace"
import { CheckCircle2, Download, ShieldCheck, SlidersHorizontal } from "lucide-react"

export const metadata = {
    title: "Catálogo de Listas | LeadStore",
    description: "Explore nosso catálogo de listas de leads qualificados para comércio exterior.",
}

type CatalogSearchParams = {
    countries?: string
    industries?: string
    category?: string
    search?: string
    page?: string
}

interface CatalogPageProps {
    searchParams: Promise<CatalogSearchParams>
}

function buildPageHref(params: CatalogSearchParams, page: number) {
    const nextParams = new URLSearchParams()

    if (params.countries) nextParams.set("countries", params.countries)
    if (params.industries) nextParams.set("industries", params.industries)
    if (params.category) nextParams.set("category", params.category)
    if (params.search) nextParams.set("search", params.search)
    nextParams.set("page", page.toString())

    return `/catalog?${nextParams.toString()}`
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
    const params = await searchParams

    const countries = params.countries?.split(",").filter(Boolean) || []
    const industries = params.industries?.split(",").filter(Boolean) || []
    const category = params.category || undefined
    const search = params.search || ""
    const requestedPage = Number.parseInt(params.page || "1", 10)
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1

    const { lists, total, pages } = await getMarketplaceLists({
        countries,
        industries,
        category,
        search,
        page,
    })

    const filterCounts = await getFilterCounts()
    const visibleLeadTotal = lists.reduce((sum, list) => sum + list.totalLeads, 0)
    const activeFilterCount = countries.length + industries.length + (category ? 1 : 0) + (search ? 1 : 0)

    return (
        <div className="min-h-screen bg-gray-50">
            <section className="border-b border-gray-200 bg-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-end">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                                <ShieldCheck className="h-4 w-4" />
                                Bases prontas para prospecção B2B
                            </div>
                            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                                Encontre a lista certa antes de gastar tempo com prospecção manual
                            </h1>
                            <p className="mt-3 max-w-2xl text-base text-gray-600">
                                Filtre por mercado, setor e categoria para comprar apenas os dados que fazem sentido para sua campanha.
                            </p>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <SlidersHorizontal className="h-4 w-4 text-[#4a2c5a]" />
                                Busca rápida
                            </div>
                            <Suspense fallback={<SearchSkeleton />}>
                                <CatalogSearch defaultValue={search} />
                            </Suspense>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-3">
                        <TrustStep
                            icon={CheckCircle2}
                            title="Compare"
                            description="Veja volume, países e setores antes de decidir."
                        />
                        <TrustStep
                            icon={ShieldCheck}
                            title="Compre com segurança"
                            description="Checkout via PayPal e pedido registrado na sua conta."
                        />
                        <TrustStep
                            icon={Download}
                            title="Baixe na hora"
                            description="Acesse CSV ou Excel assim que o pagamento for confirmado."
                        />
                    </div>
                </div>
            </section>

            <div className="container mx-auto flex flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start">
                <aside className="rounded-lg border border-gray-200 bg-white p-4 lg:sticky lg:top-24 lg:w-72 lg:shrink-0">
                    <Suspense fallback={<SidebarSkeleton />}>
                        <CatalogSidebar
                            selectedCountries={countries}
                            selectedIndustries={industries}
                            selectedCategory={category}
                            countryCounts={filterCounts.countryCounts}
                            industryCounts={filterCounts.industryCounts}
                            categoryCounts={filterCounts.categoryCounts}
                        />
                    </Suspense>
                </aside>

                <main className="min-w-0 flex-1">
                    <div className="mb-6">
                        <CatalogStats
                            total={total}
                            visibleLeadTotal={visibleLeadTotal}
                            activeFilterCount={activeFilterCount}
                            page={page}
                            pages={pages}
                        />
                    </div>

                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Listas disponíveis
                            </h2>
                            <p className="text-sm text-gray-500">
                                {total.toLocaleString()} resultado{total === 1 ? "" : "s"} para os critérios atuais
                            </p>
                        </div>
                        {pages > 1 && (
                            <span className="text-sm text-gray-500">
                                Página {page} de {pages}
                            </span>
                        )}
                    </div>

                    <CatalogGrid lists={lists} />

                    {pages > 1 && (
                        <nav className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Paginação do catálogo">
                            {Array.from({ length: pages }, (_, i) => i + 1).map((pageNumber) => (
                                <a
                                    key={pageNumber}
                                    href={buildPageHref(params, pageNumber)}
                                    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                        pageNumber === page
                                            ? "bg-[#4a2c5a] text-white"
                                            : "border border-gray-200 bg-white text-gray-700 hover:bg-purple-50"
                                    }`}
                                >
                                    {pageNumber}
                                </a>
                            ))}
                        </nav>
                    )}
                </main>
            </div>
        </div>
    )
}

function TrustStep({
    icon: Icon,
    title,
    description,
}: {
    icon: ComponentType<{ className?: string }>
    title: string
    description: string
}) {
    return (
        <div className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#2ec4b6]/10 text-[#1ba399]">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="font-semibold text-gray-900">{title}</div>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>
        </div>
    )
}

function SearchSkeleton() {
    return <div className="h-11 animate-pulse rounded-md bg-white" />
}

function SidebarSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-8 animate-pulse rounded bg-gray-100" />
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-6 animate-pulse rounded bg-gray-100" />
                ))}
            </div>
            <div className="mt-6 h-8 animate-pulse rounded bg-gray-100" />
            <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-6 animate-pulse rounded bg-gray-100" />
                ))}
            </div>
        </div>
    )
}
