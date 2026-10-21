import { notFound } from "next/navigation"
// eslint-disable-next-line no-restricted-imports -- href sempre montado via getPathname() abaixo, prefixo de locale já correto
import Link from "next/link"
import type { Metadata } from "next"
import { isBlogLocale, dirForLocale, type BlogLocale } from "@/lib/blog/locales"
import { getBlogLabels } from "@/lib/blog/i18n"
import { getCategoriesWithPosts, getPublishedPostsForLocale, localesComPostPublicado } from "@/lib/blog/queries"
import { BLOG_PAGE_SIZE, normalizarPagina, totalDePaginas } from "@/lib/blog/pagination"
import { PostCard } from "@/components/blog/post-card"
import { getPathname } from "@/lib/i18n/navigation"
import { alternatesFor } from "@/lib/i18n/alternates"
import { isLocale, type Locale } from "@/lib/i18n/locales"

/**
 * O índice do blog responde nos 8 idiomas, mas só é uma página de verdade
 * onde há post publicado — nos outros é uma listagem vazia. Daí a cobertura
 * sair do banco: hreflang só entre os idiomas com post, e noindex nos demais.
 * Mesma regra que app/sitemap.ts usa para decidir quais /blog submeter.
 *
 * O canonical ignora ?categoria e ?page de propósito: são recortes da mesma
 * listagem, e cada combinação viraria uma URL concorrente no índice — o mesmo
 * tratamento que /catalog já dá aos seus filtros.
 */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    if (!isLocale(locale)) return {}

    const comPost = (await localesComPostPublicado()).filter(isLocale)

    return {
        alternates: alternatesFor("/blog", locale as Locale, comPost),
        robots: { index: comPost.includes(locale), follow: true },
    }
}

export default async function BlogIndexPage({
    params, searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ categoria?: string; page?: string }>
}) {
    const { locale } = await params
    if (!isBlogLocale(locale)) notFound()
    const { categoria, page } = await searchParams
    const labels = getBlogLabels(locale)

    const paginaPedida = normalizarPagina(page)
    const [consulta, categories] = await Promise.all([
        getPublishedPostsForLocale(locale, { categoryKey: categoria, page: paginaPedida, pageSize: BLOG_PAGE_SIZE }),
        getCategoriesWithPosts(locale),
    ])

    // Página fora do intervalo (link antigo, URL editada à mão) mostra a última
    // em vez de uma grade vazia — o índice já foi indexado com outros totais.
    const paginas = totalDePaginas(consulta.total)
    const paginaAtual = Math.min(paginaPedida, paginas)
    const { posts } = paginaAtual === paginaPedida
        ? consulta
        : await getPublishedPostsForLocale(locale, { categoryKey: categoria, page: paginaAtual, pageSize: BLOG_PAGE_SIZE })

    const hrefDaPagina = (p: number) => getPathname({
        href: {
            pathname: "/blog",
            query: {
                ...(categoria ? { categoria } : {}),
                ...(p > 1 ? { page: p } : {}),
            },
        },
        locale,
    })

    return (
        <div className="min-h-screen bg-white text-gray-950" dir={dirForLocale(locale)}>
            <div className="container mx-auto px-4 py-14">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Blog</h1>

                <div className="mt-6 flex flex-wrap gap-2">
                    <Link href={getPathname({ href: "/blog", locale })}
                        className={`rounded-full border px-3 py-1 text-sm ${!categoria ? "bg-gray-950 text-white" : "text-gray-600"}`}>
                        {labels.allCategories}
                    </Link>
                    {categories.map((c) => (
                        <Link key={c.id} href={getPathname({ href: { pathname: "/blog", query: { categoria: c.key } }, locale })}
                            className={`rounded-full border px-3 py-1 text-sm ${categoria === c.key ? "bg-gray-950 text-white" : "text-gray-600"}`}>
                            {c.translations[0]?.name ?? c.key}
                        </Link>
                    ))}
                </div>

                {posts.length === 0 ? (
                    <p className="mt-10 text-gray-500">{labels.empty}</p>
                ) : (
                    <div className="mt-10 grid gap-4 md:grid-cols-3">
                        {posts.map((p) => (
                            <PostCard key={p.id} locale={locale as BlogLocale}
                                slug={p.translation.slug} title={p.translation.title} excerpt={p.translation.excerpt}
                                coverImageUrl={p.coverImageUrl} categoryName={p.categoryName}
                                dateLabel={p.publishedAt ? new Date(p.publishedAt).toLocaleDateString(locale) : ""} />
                        ))}
                    </div>
                )}

                {paginas > 1 && (
                    <nav className="mt-10 flex items-center justify-between gap-4">
                        {paginaAtual > 1
                            ? <Link href={hrefDaPagina(paginaAtual - 1)} rel="prev"
                                className="rounded-full border px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                                {labels.previous}
                            </Link>
                            : <span aria-disabled="true"
                                className="rounded-full border px-4 py-2 text-sm text-gray-300">
                                {labels.previous}
                            </span>}
                        <span className="text-sm text-gray-500">
                            {labels.pageOf.replace("{current}", String(paginaAtual)).replace("{total}", String(paginas))}
                        </span>
                        {paginaAtual < paginas
                            ? <Link href={hrefDaPagina(paginaAtual + 1)} rel="next"
                                className="rounded-full border px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                                {labels.next}
                            </Link>
                            : <span aria-disabled="true"
                                className="rounded-full border px-4 py-2 text-sm text-gray-300">
                                {labels.next}
                            </span>}
                    </nav>
                )}
            </div>
        </div>
    )
}
