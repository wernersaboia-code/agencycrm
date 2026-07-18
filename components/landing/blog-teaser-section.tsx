import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { getLatestPostsForTeaser } from "@/lib/blog/queries"
import type { LandingLocale } from "./types"

export async function BlogTeaserSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.blog" })
    const posts = await getLatestPostsForTeaser(locale, 3)

    return (
        <section className="bg-muted/40 py-14 md:py-18">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">{t("eyebrow")}</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t("title")}</h2>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base md:leading-7">{t("intro")}</p>
                </div>

                {posts.length > 0 && (
                    <div className="mt-10 grid gap-4 md:grid-cols-3">
                        {posts.map((post) => (
                            <Link key={post.postId} href={`/blog/${locale}/${post.slug}`}
                                className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                {post.coverImageUrl
                                    ? <img src={post.coverImageUrl} alt="" className="h-28 w-full object-cover" />
                                    : <div className="h-28 bg-gradient-to-br from-indigo-100 to-indigo-200" />}
                                <div className="p-5">
                                    {post.categoryName && <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">{post.categoryName}</p>}
                                    <h3 className="mt-2 font-semibold leading-snug text-foreground group-hover:text-indigo-700">{post.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link href={`/blog/${locale}`} className="text-sm font-semibold text-indigo-700 hover:underline">
                        {t("title")} →
                    </Link>
                </div>
            </div>
        </section>
    )
}
