import { dirForLocale, type BlogLocale } from "@/lib/blog/locales"

interface PostArticleProps {
    locale: BlogLocale
    categoryName: string | null
    title: string
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
 * Segurança: `contentHtml` já passou por limpeza e sanitização no servidor ao
 * salvar. Não acrescentar sanitização aqui — ver o comentário em
 * `lib/utils/html-sanitizer.ts` sobre por que isso não roda no cliente.
 */
export function PostArticle({
    locale,
    categoryName,
    title,
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
                {dateLabel && <p className="mt-3 text-sm text-gray-500">{dateLabel}</p>}
                {coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverImageUrl} alt="" className="mt-6 w-full rounded-lg object-cover" />
                )}
                <div
                    className="prose prose-indigo mt-8 max-w-none"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
                {children}
            </div>
        </article>
    )
}
