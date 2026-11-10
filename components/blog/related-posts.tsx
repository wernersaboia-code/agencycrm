import { Link } from "@/lib/i18n/navigation"
import { getBlogLabels } from "@/lib/blog/i18n"
import type { BlogLocale } from "@/lib/blog/locales"

/**
 * Lista de outros artigos ao pé do post. Sem ela, um artigo só levava ao
 * seguinte passando pelo índice do blog.
 */
export function RelatedPosts({
    locale, posts,
}: {
    locale: BlogLocale
    posts: { id: string; slug: string; title: string; subtitle: string | null }[]
}) {
    if (posts.length === 0) return null
    const labels = getBlogLabels(locale)

    return (
        <nav aria-labelledby="leia-tambem" className="mt-12 border-t pt-8">
            <h2 id="leia-tambem" className="text-xl font-bold tracking-tight">{labels.readAlso}</h2>
            <ul className="mt-4 space-y-4">
                {posts.map((p) => (
                    <li key={p.id}>
                        <Link href={`/blog/${p.slug}`} locale={locale} className="group block">
                            <span className="font-semibold text-indigo-700 group-hover:underline">{p.title}</span>
                            {p.subtitle && <span className="mt-0.5 block text-sm text-gray-600">{p.subtitle}</span>}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
