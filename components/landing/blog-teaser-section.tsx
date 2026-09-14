// eslint-disable-next-line no-restricted-imports -- href sempre montado via getPathname() abaixo, prefixo de locale já correto
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { getLatestPostsForTeaser } from "@/lib/blog/queries"
import { getPathname } from "@/lib/i18n/navigation"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

export async function BlogTeaserSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.blog" })
    const posts = await getLatestPostsForTeaser(locale, 3)

    return (
        <Section tone="muted">
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} centered />

            {posts.length > 0 && (
                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {posts.map((post) => (
                        <Link key={post.postId} href={getPathname({ href: `/blog/${post.slug}`, locale })}
                            className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            {post.coverImageUrl
                                ? <img src={post.coverImageUrl} alt="" className="h-28 w-full object-cover" />
                                : <div className="h-28 bg-gradient-to-br from-brand-accent/20 to-brand-accent/40" />}
                            <div className="p-5">
                                {post.categoryName && <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent-strong">{post.categoryName}</p>}
                                <h3 className="mt-2 font-semibold leading-snug text-foreground group-hover:text-brand-accent-strong">{post.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <div className="mt-8 text-center">
                <Link href={getPathname({ href: "/blog", locale })} className="text-sm font-semibold text-brand-accent-strong hover:underline">
                    {t("title")} →
                </Link>
            </div>
        </Section>
    )
}
