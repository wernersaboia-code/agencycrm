import { Suspense } from "react"
import type { ComponentType } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { alternatesFor } from "@/lib/i18n/alternates"
import type { Locale } from "@/lib/i18n/locales"
import { Link } from "@/lib/i18n/navigation"
import { CatalogFiltersPanel } from "@/components/marketplace/catalog-filters-panel"
import { CatalogGrid } from "@/components/marketplace/catalog-grid"
import { CatalogSearch } from "@/components/marketplace/catalog-search"
import { CatalogStats } from "@/components/marketplace/catalog-stats"
import { getMarketplaceLists, getFilterCounts } from "@/actions/marketplace"
import { AlertTriangle, CheckCircle2, Download, ShieldCheck, SlidersHorizontal } from "lucide-react"

// Renderização dinâmica: a página consulta o banco a cada request, com filtros
// e busca vindos de searchParams — o resultado varia por requisição, então
// não pode ser servido do cache.
export const dynamic = "force-dynamic"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations("catalog")

    return {
        title: t("metaTitle"),
        description: t("heroSubtitle"),
        alternates: alternatesFor("/catalog", locale as Locale),
    }
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
    const t = await getTranslations("catalog")
    const params = await searchParams

    const countries = params.countries?.split(",").filter(Boolean) || []
    const industries = params.industries?.split(",").filter(Boolean) || []
    const category = params.category || undefined
    const search = params.search || ""
    const requestedPage = Number.parseInt(params.page || "1", 10)
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1

    const { lists, total, pages, filterCounts, failed } = await getCatalogData({
        countries,
        industries,
        category,
        search,
        page,
    })
    const visibleCountryTotal = new Set(lists.flatMap((list) => list.countries)).size
    const activeFilterCount = countries.length + industries.length + (category ? 1 : 0) + (search ? 1 : 0)

    return (
        <div className="min-h-screen bg-muted/40">
            <section className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-end">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                                <ShieldCheck className="h-4 w-4" />
                                {t("badge")}
                            </div>
                            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                                {t("heroTitle")}
                            </h1>
                            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                                {t("heroSubtitle")}
                            </p>
                        </div>

                        <div className="rounded-lg border border-border bg-muted/40 p-4">
                            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                                <SlidersHorizontal className="h-4 w-4 text-brand" />
                                {t("quickSearch")}
                            </div>
                            <Suspense fallback={<SearchSkeleton />}>
                                <CatalogSearch defaultValue={search} />
                            </Suspense>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-3">
                        <TrustStep
                            icon={CheckCircle2}
                            title={t("trustCompareTitle")}
                            description={t("trustCompareDesc")}
                        />
                        <TrustStep
                            icon={ShieldCheck}
                            title={t("trustBuyTitle")}
                            description={t("trustBuyDesc")}
                        />
                        <TrustStep
                            icon={Download}
                            title={t("trustDownloadTitle")}
                            description={t("trustDownloadDesc")}
                        />
                    </div>
                </div>
            </section>

            <div className="container mx-auto flex flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start">
                <Suspense fallback={<SidebarSkeleton />}>
                    <CatalogFiltersPanel
                        selectedCountries={countries}
                        selectedIndustries={industries}
                        selectedCategory={category}
                        countryCounts={filterCounts.countryCounts}
                        industryCounts={filterCounts.industryCounts}
                        categoryCounts={filterCounts.categoryCounts}
                        activeFilterCount={activeFilterCount}
                    />
                </Suspense>

                <main className="min-w-0 flex-1">
                    {failed && (
                        <div
                            role="alert"
                            className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                                <div>
                                    <p className="font-semibold text-amber-900">{t("loadErrorTitle")}</p>
                                    <p className="mt-1 text-sm text-amber-800">{t("loadErrorDesc")}</p>
                                </div>
                            </div>
                            <Link
                                href={buildPageHref(params, page)}
                                className="shrink-0 rounded-md border border-amber-300 bg-card px-4 py-2 text-center text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100"
                            >
                                {t("loadErrorRetry")}
                            </Link>
                        </div>
                    )}

                    {!failed && (
                        <>
                            <div className="mb-6">
                                <CatalogStats
                                    total={total}
                                    visibleCountryTotal={visibleCountryTotal}
                                    activeFilterCount={activeFilterCount}
                                    page={page}
                                    pages={pages}
                                />
                            </div>

                            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {t("availableLists")}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {t("results", { count: total })}
                                    </p>
                                </div>
                                {pages > 1 && (
                                    <span className="text-sm text-muted-foreground">
                                        {t("pageOf", { page, pages })}
                                    </span>
                                )}
                            </div>

                            <CatalogGrid lists={lists} />

                            {pages > 1 && (
                                <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label={t("pageOf", { page, pages })}>
                                    <PageLink
                                        href={buildPageHref(params, page - 1)}
                                        label={t("previousPage")}
                                        disabled={page === 1}
                                    >
                                        ‹
                                    </PageLink>

                                    {buildPageWindow(page, pages).map((entry, index) =>
                                        entry === "gap" ? (
                                            <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted-foreground">
                                                …
                                            </span>
                                        ) : (
                                            <PageLink
                                                key={entry}
                                                href={buildPageHref(params, entry)}
                                                label={t("goToPage", { page: entry })}
                                                current={entry === page}
                                            >
                                                {entry}
                                            </PageLink>
                                        )
                                    )}

                                    <PageLink
                                        href={buildPageHref(params, page + 1)}
                                        label={t("nextPage")}
                                        disabled={page === pages}
                                    >
                                        ›
                                    </PageLink>
                                </nav>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}

async function getCatalogData(params: {
    countries: string[]
    industries: string[]
    category?: string
    search: string
    page: number
}) {
    try {
        const [{ lists, total, pages }, filterCounts] = await Promise.all([
            getMarketplaceLists(params),
            getFilterCounts(),
        ])

        return { lists, total, pages, filterCounts, failed: false }
    } catch (error) {
        console.error("Failed to load catalog data", error)

        // `failed` separa "o banco caiu" de "nenhuma lista bate com o filtro".
        // Mostrar "0 resultados" numa falha faz o usuário culpar os próprios
        // filtros e sair do catálogo.
        return {
            lists: [],
            total: 0,
            pages: 0,
            filterCounts: {
                countryCounts: {},
                industryCounts: {},
                categoryCounts: {},
            },
            failed: true,
        }
    }
}

/**
 * Primeira, última e as vizinhas da atual. Renderizar todas as páginas explode
 * a barra assim que o catálogo cresce.
 */
function buildPageWindow(current: number, total: number): Array<number | "gap"> {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1)
    }

    const pages = new Set([1, total, current, current - 1, current + 1])
    const visible = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

    return visible.flatMap((p, i) =>
        i > 0 && p - visible[i - 1] > 1 ? (["gap", p] as Array<number | "gap">) : [p]
    )
}

function PageLink({
    href,
    label,
    children,
    current = false,
    disabled = false,
}: {
    href: string
    label: string
    children: React.ReactNode
    current?: boolean
    disabled?: boolean
}) {
    const className = `flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
        current
            ? "bg-brand text-white"
            : "border border-border bg-card text-foreground hover:bg-purple-50"
    }`

    if (disabled) {
        return (
            <span aria-hidden="true" className={`${className} cursor-not-allowed opacity-40`}>
                {children}
            </span>
        )
    }

    return (
        <Link
            href={href}
            aria-label={label}
            aria-current={current ? "page" : undefined}
            className={className}
        >
            {children}
        </Link>
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
        <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent-strong">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="font-semibold text-foreground">{title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}

function SearchSkeleton() {
    return <div className="h-11 animate-pulse rounded-md bg-card" />
}

function SidebarSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-8 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-6 animate-pulse rounded bg-muted" />
                ))}
            </div>
            <div className="mt-6 h-8 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-6 animate-pulse rounded bg-muted" />
                ))}
            </div>
        </div>
    )
}
