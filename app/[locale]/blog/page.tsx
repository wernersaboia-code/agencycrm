import { notFound } from "next/navigation"
// eslint-disable-next-line no-restricted-imports -- href sempre montado via getPathname() abaixo, prefixo de locale já correto
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { isBlogLocale, dirForLocale, type BlogLocale } from "@/lib/blog/locales"
import { getBlogLabels } from "@/lib/blog/i18n"
import { getPublishedPostsForLocale } from "@/lib/blog/queries"
import { PostCard } from "@/components/blog/post-card"
import { getPathname } from "@/lib/i18n/navigation"

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

    const [{ posts }, categories] = await Promise.all([
        getPublishedPostsForLocale(locale, { categoryKey: categoria, page: page ? Number(page) : 1 }),
        prisma.blogCategory.findMany({ include: { translations: { where: { locale } } } }),
    ])

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
            </div>
        </div>
    )
}
