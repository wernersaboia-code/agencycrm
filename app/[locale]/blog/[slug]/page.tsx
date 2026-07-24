import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isBlogLocale, dirForLocale, type BlogLocale } from "@/lib/blog/locales"
import { getBlogLabels } from "@/lib/blog/i18n"
import { getPostBySlug } from "@/lib/blog/queries"
import { LanguageSwitcher } from "@/components/blog/language-switcher"
import { JsonLd } from "@/components/seo/json-ld"
import { buildBlogPostingSchema } from "@/lib/seo/schema"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
    const { locale, slug } = await params
    if (!isBlogLocale(locale)) return {}
    const data = await getPostBySlug(locale, slug)
    if (!data) return {}
    const og = data.translation.ogImageUrl ?? data.post.coverImageUrl ?? undefined
    return {
        title: data.translation.title,
        description: data.translation.metaDescription ?? data.translation.excerpt,
        openGraph: {
            title: data.translation.title,
            description: data.translation.metaDescription ?? data.translation.excerpt,
            images: og ? [{ url: og }] : undefined,
            locale,
        },
    }
}

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>
}) {
    const { locale, slug } = await params
    if (!isBlogLocale(locale)) notFound()
    const data = await getPostBySlug(locale, slug)
    if (!data) notFound()

    const labels = getBlogLabels(locale)
    const { translation, post, availableLocales, localeSlugs, categoryName } = data
    const dateLabel = post.publishedAt
        ? `${labels.publishedOn} ${new Date(post.publishedAt).toLocaleDateString(locale)}`
        : ""

    return (
        <article className="min-h-screen bg-white text-gray-950" dir={dirForLocale(locale)}>
            {post.publishedAt && (
                <JsonLd
                    data={buildBlogPostingSchema({
                        title: translation.title,
                        description: translation.metaDescription ?? translation.excerpt,
                        slug: localeSlugs[locale] ?? slug,
                        locale,
                        publishedAt: post.publishedAt,
                        updatedAt: post.updatedAt,
                        imageUrl: translation.ogImageUrl ?? post.coverImageUrl,
                    })}
                />
            )}
            <div className="mx-auto max-w-3xl px-4 py-14">
                {categoryName && <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">{categoryName}</p>}
                <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{translation.title}</h1>
                {dateLabel && <p className="mt-3 text-sm text-gray-500">{dateLabel}</p>}
                {post.coverImageUrl && <img src={post.coverImageUrl} alt="" className="mt-6 w-full rounded-lg object-cover" />}
                {/*
                  Segurança: contentHtml já foi sanitizado no servidor no momento da escrita
                  (Task 8), então renderizá-lo aqui via dangerouslySetInnerHTML é seguro. Não
                  adicionar sanitização client-side.
                */}
                <div
                    className="prose prose-indigo mt-8 max-w-none"
                    dangerouslySetInnerHTML={{ __html: translation.contentHtml }}
                />
                <LanguageSwitcher locale={locale as BlogLocale} availableLocales={availableLocales} localeSlugs={localeSlugs} />
            </div>
        </article>
    )
}
