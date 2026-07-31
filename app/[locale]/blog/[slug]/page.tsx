import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isBlogLocale, type BlogLocale } from "@/lib/blog/locales"
import { getBlogLabels } from "@/lib/blog/i18n"
import { getPostBySlug } from "@/lib/blog/queries"
import { LanguageSwitcher } from "@/components/blog/language-switcher"
import { JsonLd } from "@/components/seo/json-ld"
import { buildBlogPostingSchema } from "@/lib/seo/schema"
import { PostArticle } from "@/components/blog/post-article"

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
        <>
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
            <PostArticle
                locale={locale as BlogLocale}
                categoryName={categoryName}
                title={translation.title}
                dateLabel={dateLabel}
                coverImageUrl={post.coverImageUrl}
                contentHtml={translation.contentHtml}
            >
                <LanguageSwitcher
                    locale={locale as BlogLocale}
                    availableLocales={availableLocales}
                    localeSlugs={localeSlugs}
                />
            </PostArticle>
        </>
    )
}
