import type { Metadata } from "next"
import { ArrowRight, Check, RefreshCw } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link, getPathname } from "@/lib/i18n/navigation"
import { alternatesFor } from "@/lib/i18n/alternates"
import type { Locale } from "@/lib/i18n/locales"
import { Button } from "@/components/ui/button"
import { Section, SectionHeading } from "@/components/landing/section"
import { JsonLd } from "@/components/seo/json-ld"
import { BASE_URL, buildBreadcrumbSchema } from "@/lib/seo/schema"

type TrustCard = { title: string; body: string }

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "about.meta" })

    return {
        title: t("title"),
        description: t("description"),
        alternates: alternatesFor("/about", locale as Locale),
    }
}

/**
 * Página de confiança do funil ("Por que Easy Prospect"). A estrutura segue o
 * documento de marca do sócio; o texto passa pelas 4 regras de voz do projeto:
 * IA nunca como argumento de venda (aparece ao lado da revisão humana, na mesma
 * frase), ninguém é nomeado, fontes sempre introduzidas por "entre elas", e
 * nenhum número sem base — por isso o "100.000" dos documentos não está aqui.
 *
 * Todo texto vem de `messages/*.json`. Antes de acrescentar qualquer frase,
 * confira se ela descreve algo que a operação de fato faz.
 */
export default async function AboutPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "about" })
    const heroParagraphs = t.raw("hero.paragraphs") as string[]
    const methodologyBody = t.raw("methodology.body") as string[]
    const sourceItems = t.raw("sources.items") as string[]
    const reviewItems = t.raw("review.items") as string[]
    const deliveryItems = t.raw("delivery.items") as string[]
    const limitItems = t.raw("limits.items") as string[]
    const trustCards = t.raw("trust.cards") as TrustCard[]

    const breadcrumb = buildBreadcrumbSchema([
        {
            name: t("breadcrumb.home"),
            url: `${BASE_URL}${getPathname({ href: "/", locale: locale as Locale })}`,
        },
        {
            name: t("breadcrumb.current"),
            url: `${BASE_URL}${getPathname({ href: "/about", locale: locale as Locale })}`,
        },
    ])

    return (
        <>
            <JsonLd data={breadcrumb} />

            <Section width="narrow" className="border-t-0">
                <p className="text-sm font-semibold uppercase tracking-wider text-brand-accent-strong">
                    {t("hero.eyebrow")}
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    {t("hero.title")}
                </h1>
                <div className="mt-4 space-y-4">
                    {heroParagraphs.map((paragraph) => (
                        <p key={paragraph} className="text-lg leading-8 text-muted-foreground">
                            {paragraph}
                        </p>
                    ))}
                </div>
            </Section>

            <Section tone="muted" width="narrow">
                <SectionHeading
                    eyebrow={t("methodology.eyebrow")}
                    title={t("methodology.title")}
                    intro={t("methodology.intro")}
                />

                <div className="mt-8 space-y-4">
                    {methodologyBody.map((paragraph) => (
                        <p key={paragraph} className="leading-7 text-muted-foreground">
                            {paragraph}
                        </p>
                    ))}
                </div>
            </Section>

            <Section width="narrow">
                <div className="grid gap-10 md:grid-cols-2">
                    <ListBlock
                        title={t("sources.title")}
                        intro={t("sources.intro")}
                        items={sourceItems}
                        note={t("sources.note")}
                    />
                    <ListBlock
                        title={t("review.title")}
                        intro={t("review.intro")}
                        items={reviewItems}
                        note={t("review.note")}
                    />
                </div>

                <div className="mt-10 flex gap-4 rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent-strong">
                        <RefreshCw className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">{t("updates.title")}</h2>
                        <p className="mt-2 leading-7 text-muted-foreground">{t("updates.body")}</p>
                    </div>
                </div>
            </Section>

            <Section tone="muted" width="narrow">
                <h2 className="text-2xl font-bold text-foreground">{t("delivery.title")}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{t("delivery.intro")}</p>

                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {deliveryItems.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                            <Check
                                className="mt-1 h-4 w-4 shrink-0 text-brand-accent-strong"
                                aria-hidden="true"
                            />
                            <span className="leading-7 text-muted-foreground">{item}</span>
                        </li>
                    ))}
                </ul>

                <p className="mt-6 leading-7 text-muted-foreground">{t("delivery.note")}</p>
            </Section>

            <Section width="narrow">
                <ListBlock
                    title={t("limits.title")}
                    intro={t("limits.intro")}
                    items={limitItems}
                    note={t("limits.note")}
                />
            </Section>

            <Section tone="muted">
                <SectionHeading eyebrow={t("trust.eyebrow")} title={t("trust.title")} />

                <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {trustCards.map((card) => (
                        <div
                            key={card.title}
                            className="h-full rounded-lg border border-border bg-card p-6 shadow-sm"
                        >
                            <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.body}</p>
                        </div>
                    ))}
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-start justify-between gap-6 rounded-lg bg-brand p-8 text-brand-foreground md:flex-row md:items-center md:p-10">
                    <div>
                        <h2 className="text-2xl font-bold md:text-3xl">{t("cta.title")}</h2>
                        <p className="mt-2 max-w-xl leading-7 text-brand-foreground/75">{t("cta.body")}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-3">
                        <Button
                            size="lg"
                            className="bg-brand-foreground text-brand hover:bg-brand-foreground/90"
                            asChild
                        >
                            <Link href="/catalog">
                                {t("cta.catalog")}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-brand-foreground/40 bg-transparent text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
                            asChild
                        >
                            <Link href="/faq">{t("cta.faq")}</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    )
}

/**
 * Bloco de "afirmação + itens + ressalva". A ressalva vem sempre depois da
 * lista, e não antes: é ela que limita o que a lista promete.
 */
function ListBlock({
    title,
    intro,
    items,
    note,
}: {
    title: string
    intro: string
    items: string[]
    note: string
}) {
    return (
        <div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{intro}</p>
            <ul className="mt-4 space-y-2">
                {items.map((item) => (
                    <li key={item} className="flex items-start gap-3 leading-7 text-muted-foreground">
                        <span
                            className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent-strong"
                            aria-hidden="true"
                        />
                        {item}
                    </li>
                ))}
            </ul>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{note}</p>
        </div>
    )
}
