import { dirForLocale, type BlogLocale } from "@/lib/blog/locales"
import { rebaixarTitulosDoCorpo } from "@/lib/blog/heading-levels"

interface PostArticleProps {
    locale: BlogLocale
    categoryName: string | null
    title: string
    /** Opcional: a parte da frase que não coube no título curto. */
    subtitle?: string | null
    /** Já formatado por quem chama — a prévia e o público formatam igual. */
    dateLabel: string
    coverImageUrl: string | null
    /** Sanitizado no servidor no momento da escrita (actions/admin/blog.ts). */
    contentHtml: string
    children?: React.ReactNode
}

/**
 * Renderização do artigo, compartilhada pela página pública e pela prévia do
 * admin. Existe para que a prévia não possa divergir do publicado: se
 * divergir, é bug nos dois.
 *
 * Segurança: `contentHtml` já foi limpo e sanitizado no SERVIDOR ao salvar
 * (`lib/blog/sanitize-translations.ts`) — por isso não se sanitiza de novo
 * aqui.
 */
export function PostArticle({
    locale,
    categoryName,
    title,
    subtitle,
    dateLabel,
    coverImageUrl,
    contentHtml,
    children,
}: PostArticleProps) {
    return (
        <article className="min-h-screen bg-white text-gray-950" dir={dirForLocale(locale)}>
            <div className="mx-auto max-w-3xl px-4 py-14">
                {categoryName && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                        {categoryName}
                    </p>
                )}
                <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
                {/* <p>, não <h2>: é continuação do título, não uma seção do texto. */}
                {subtitle && <p className="mt-3 text-xl leading-snug text-gray-600 md:text-2xl">{subtitle}</p>}
                {dateLabel && <p className="mt-3 text-sm text-gray-500">{dateLabel}</p>}
                {coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverImageUrl} alt="" className="mt-6 w-full rounded-lg object-cover" />
                )}
                {/* rebaixarTitulosDoCorpo: posts antigos têm <h1> no corpo, e o
                    único h1 da página é o título acima. Na leitura, e não só
                    no salvamento, para valer sem regravar o banco. */}
                <div
                    className="prose prose-lg prose-indigo mt-8 max-w-none prose-headings:tracking-tight prose-img:rounded-lg [&_td>p]:my-0 [&_th>p]:my-0 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: rebaixarTitulosDoCorpo(contentHtml) }}
                />
                {children}
            </div>
        </article>
    )
}
