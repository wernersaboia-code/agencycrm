import { Suspense } from "react"
import type { ComponentType } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { alternatesFor } from "@/lib/i18n/alternates"
import type { Locale } from "@/lib/i18n/locales"
import { paginaSemFiltro, type CatalogSearchParams } from "@/lib/seo/catalog-pagination"
import { Link } from "@/lib/i18n/navigation"
import { CatalogFiltersPanel } from "@/components/marketplace/catalog-filters-panel"
import { CatalogGrid } from "@/components/marketplace/catalog-grid"
import { CatalogSearch } from "@/components/marketplace/catalog-search"
import { CatalogSort } from "@/components/marketplace/catalog-sort"
import { lerOrdenacao } from "@/lib/marketplace/ordenacao-catalogo"
import { getMarketplaceLists, getFilterCounts } from "@/actions/marketplace"
import { getSetores } from "@/lib/marketplace/setores-servidor"
import { nomesDosSetoresDaLista, rotularSetores } from "@/lib/marketplace/setores"
import { excecoesDoIdioma, nomeDePais } from "@/lib/i18n/nome-de-pais"
import { LIST_LANGUAGES } from "@/lib/constants/list-languages"
import { AlertTriangle, CheckCircle2, Download, ShieldCheck, SlidersHorizontal, X } from "lucide-react"

// Renderização dinâmica: a página consulta o banco a cada request, com filtros
// e busca vindos de searchParams — o resultado varia por requisição, então
// não pode ser servido do cache.
export const dynamic = "force-dynamic"

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<CatalogSearchParams>
}): Promise<Metadata> {
    const [{ locale }, sp, t] = await Promise.all([
        params,
        searchParams,
        getTranslations("catalog"),
    ])

    const page = paginaSemFiltro(sp)
    const base = alternatesFor("/catalog", locale as Locale)

    if (page === 1) {
        return {
            title: t("metaTitle"),
            description: t("heroSubtitle"),
            alternates: base,
        }
    }

    // O sufixo é aplicado sobre as URLs já montadas em vez de passar a query
    // para getPathname: o prefixo de idioma é a única regra que interessa ali,
    // e assim a paginação não depende de como o next-intl trata query string.
    const sufixo = `?page=${page}`

    return {
        // Título próprio por página: sete resultados com o mesmo título são
        // sete duplicatas aos olhos do buscador, ainda que o canonical esteja
        // certo.
        title: `${t("metaTitle")} — ${t("metaPageSuffix", { page })}`,
        description: t("heroSubtitle"),
        alternates: {
            canonical: `${base.canonical}${sufixo}`,
            languages: Object.fromEntries(
                Object.entries(base.languages ?? {}).map(([lang, url]) => [lang, `${url}${sufixo}`])
            ),
        },
    }
}

interface CatalogPageProps {
    params: Promise<{ locale: string }>
    searchParams: Promise<CatalogSearchParams>
}

function buildPageHref(params: CatalogSearchParams, page: number) {
    const nextParams = new URLSearchParams()

    if (params.countries) nextParams.set("countries", params.countries)
    if (params.industries) nextParams.set("industries", params.industries)
    if (params.languages) nextParams.set("languages", params.languages)
    if (params.search) nextParams.set("search", params.search)
    if (params.sort) nextParams.set("sort", params.sort)
    nextParams.set("page", page.toString())

    return `/catalog?${nextParams.toString()}`
}

export default async function CatalogPage({ params: routeParams, searchParams }: CatalogPageProps) {
    const t = await getTranslations("catalog")
    const { locale } = await routeParams
    const params = await searchParams

    const countries = params.countries?.split(",").filter(Boolean) || []
    const industries = params.industries?.split(",").filter(Boolean) || []
    const languages = params.languages?.split(",").filter(Boolean) || []
    const search = params.search || ""
    const ordenacao = lerOrdenacao(params.sort)
    const requestedPage = Number.parseInt(params.page || "1", 10)
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1

    const { lists: listasDoBanco, total, pages, filterCounts, setores, failed } = await getCatalogData({
        countries,
        industries,
        languages,
        search,
        page,
        sort: ordenacao,
        locale,
    })
    const setoresRotulados = rotularSetores(setores, locale)
    const lists = listasDoBanco.map((list) => ({
        ...list,
        industryNames: nomesDosSetoresDaLista(list.industries, setores, locale),
    }))
    const activeFilterCount =
        countries.length + industries.length + languages.length + (search ? 1 : 0)

    // Uma etiqueta por filtro ativo. O link de cada uma é a mesma busca sem
    // aquele valor, de volta à página 1.
    const filtros = { countries, industries, languages }
    const semValor = (chave: keyof typeof filtros | "search", valor?: string) => {
        const proximo = new URLSearchParams()
        for (const [k, valores] of Object.entries(filtros)) {
            const resto = k === chave ? valores.filter((v) => v !== valor) : valores
            if (resto.length > 0) proximo.set(k, resto.join(","))
        }
        if (search && chave !== "search") proximo.set("search", search)
        // Tirar um filtro não desfaz a ordem que o visitante escolheu.
        if (params.sort) proximo.set("sort", params.sort)
        const query = proximo.toString()
        return query ? `/catalog?${query}` : "/catalog"
    }
    const excecoesDePais = excecoesDoIdioma(locale)
    const nomeDoSetorPorId = new Map(setoresRotulados.map((setor) => [setor.id, setor.nome]))
    const chips = [
        ...countries.map((code) => ({ href: semValor("countries", code), label: nomeDePais(code, locale, excecoesDePais) })),
        ...industries.map((id) => ({ href: semValor("industries", id), label: nomeDoSetorPorId.get(id) ?? id })),
        ...languages.map((code) => ({
            href: semValor("languages", code),
            label: LIST_LANGUAGES.find((l) => l.code === code)?.label ?? code,
        })),
        ...(search ? [{ href: semValor("search"), label: `“${search}”` }] : []),
    ]

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

                    {/* Uma linha de ícone + título. Antes eram três cartões com
                        parágrafo, uma faixa inteira entre o título e o primeiro
                        estudo; o detalhe de cada passo está na ficha e no FAQ. */}
                    <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-foreground">
                        <TrustStep icon={CheckCircle2} title={t("trustCompareTitle")} />
                        <TrustStep icon={ShieldCheck} title={t("trustBuyTitle")} />
                        <TrustStep icon={Download} title={t("trustDownloadTitle")} />
                    </ul>
                </div>
            </section>

            <div className="container mx-auto flex flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start">
                <Suspense fallback={<SidebarSkeleton />}>
                    <CatalogFiltersPanel
                        selectedCountries={countries}
                        selectedIndustries={industries}
                        selectedLanguages={languages}
                        countryCounts={filterCounts.countryCounts}
                        industryCounts={filterCounts.industryCounts}
                        languageCounts={filterCounts.languageCounts}
                        setores={setoresRotulados}
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
                            {/* Os quatro indicadores que ficavam aqui saíram: o total
                                já está no subtítulo abaixo, a página na
                                paginação, e "0 filtros ativos" não dizia nada.
                                No lugar, só quando há filtro, o que está
                                filtrado — cada etiqueta tira o seu. */}
                            {chips.length > 0 && (
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    {chips.map((chip) => (
                                        <FilterChip key={chip.href} href={chip.href} label={chip.label} removeLabel={t("clearFilters")} />
                                    ))}
                                    {chips.length > 1 && (
                                        <Link href="/catalog" className="ms-1 text-sm font-medium text-brand-accent-strong underline underline-offset-4 hover:no-underline">
                                            {t("clearFilters")}
                                        </Link>
                                    )}
                                </div>
                            )}

                            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {t("availableLists")}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {t("results", { count: total })}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    {/* Com um resultado só não há o que ordenar. */}
                                    {total > 1 && (
                                        <Suspense fallback={null}>
                                            <CatalogSort value={ordenacao} />
                                        </Suspense>
                                    )}
                                    {pages > 1 && (
                                        <span className="text-sm text-muted-foreground">
                                            {t("pageOf", { page, pages })}
                                        </span>
                                    )}
                                </div>
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
    languages: string[]
    search: string
    page: number
    sort: string
    locale: string
}) {
    try {
        const [{ lists, total, pages }, filterCounts, setores] = await Promise.all([
            getMarketplaceLists(params),
            getFilterCounts(),
            getSetores(),
        ])

        return { lists, total, pages, filterCounts, setores, failed: false }
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
                languageCounts: {},
            },
            setores: [],
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
}: {
    icon: ComponentType<{ className?: string }>
    title: string
}) {
    return (
        <li className="inline-flex items-center gap-2">
            <Icon className="h-4 w-4 text-brand-accent-strong" />
            {title}
        </li>
    )
}

/** Etiqueta de um filtro ativo: clicar tira só aquele filtro. */
function FilterChip({ href, label, removeLabel }: { href: string; label: string; removeLabel: string }) {
    return (
        <Link
            href={href}
            aria-label={`${removeLabel}: ${label}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1 ps-3 pe-2 text-sm text-foreground transition-colors hover:border-brand-accent hover:bg-muted/40"
        >
            {label}
            <X className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        </Link>
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
