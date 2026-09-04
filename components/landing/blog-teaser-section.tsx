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
                <div className="mt-12 grid gap-6 md:grid-cols-3">
                    {posts.map((post) => (
                        <Link key={post.postId} href={getPathname({ href: `/blog/${post.slug}`, locale })}
                            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-vitrine transition hover:-translate-y-0.5 hover:shadow-vitrine-lg">
                            {/* A imagem manda no card, como nos cards de News da
                                referência. Os 112px de antes eram miniatura: ao
                                lado de painéis com pilha de páginas e diagrama,
                                o blog lia como rodapé da página em vez de seção.
                                `aspect` em vez de altura fixa para o recorte ser
                                o mesmo nas três colunas em qualquer largura. */}
                            {post.coverImageUrl
                                ? <img src={post.coverImageUrl} alt="" className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                                : <div className="aspect-[3/2] bg-gradient-to-br from-brand-accent/20 to-brand-accent/40" />}
                            <div className="p-5">
                                {/* Categoria e tempo na mesma linha, no molde da referência ("Product · 7 min").
                                    O tempo aparece mesmo sem categoria: post sem categoria ainda informa quanto custa ler. */}
                                <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent-strong">
                                    {post.categoryName ? `${post.categoryName} · ` : ""}
                                    {t("readingTime", { minutes: post.minutosLeitura })}
                                </p>
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
