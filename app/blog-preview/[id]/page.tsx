import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { getPostForPreview } from "@/lib/blog/queries"
import { getBlogLabels } from "@/lib/blog/i18n"
import { isBlogLocale, DEFAULT_BLOG_LOCALE, type BlogLocale } from "@/lib/blog/locales"
import { PostArticle } from "@/components/blog/post-article"

// robots: ver app/blog-preview/layout.tsx — a prévia nunca é indexada.

/**
 * Prévia do post como o leitor verá.
 *
 * Fora de `app/(app)` de propósito: o layout do super-admin traz barra lateral
 * e cabeçalho, e uma prévia com metade da largura real não serviria para nada.
 * Fora de `app/[locale]` também — o idioma vem de `?locale=`, e isto não é uma
 * página do site.
 *
 * O gate de role do proxy.ts cobre /super-admin; esta rota traz o seu próprio.
 */
export default async function BlogPreviewPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ locale?: string }>
}) {
    await requireAdmin()

    const { id } = await params
    const { locale: localeParam } = await searchParams
    // isBlogLocale recebe string, não string | undefined — daí o `?? ""`.
    const candidato = localeParam ?? ""
    const locale: BlogLocale = isBlogLocale(candidato) ? candidato : DEFAULT_BLOG_LOCALE

    const data = await getPostForPreview(id, locale)
    if (!data) notFound()

    const labels = getBlogLabels(locale)

    if (!data.translation) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-14">
                <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
                    Este post ainda não tem tradução em <strong>{locale.toUpperCase()}</strong>.
                    Escreva o título e o conteúdo nessa aba e salve para pré-visualizar.
                </p>
            </div>
        )
    }

    const dateLabel = data.post.publishedAt
        ? `${labels.publishedOn} ${new Date(data.post.publishedAt).toLocaleDateString(locale)}`
        : ""

    return (
        <>
            {data.post.status === "DRAFT" && (
                <p className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
                    Rascunho — esta página não está publicada.
                </p>
            )}
            <PostArticle
                locale={locale}
                categoryName={data.categoryName}
                title={data.translation.title}
                dateLabel={dateLabel}
                coverImageUrl={data.post.coverImageUrl}
                contentHtml={data.translation.contentHtml}
            />
        </>
    )
}
