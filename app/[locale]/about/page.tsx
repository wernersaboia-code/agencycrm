import type { Metadata } from "next"
import { ArrowRight, FileSearch, RefreshCw, Sprout } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link, getPathname } from "@/lib/i18n/navigation"
import { alternatesFor } from "@/lib/i18n/alternates"
import type { Locale } from "@/lib/i18n/locales"
import { Button } from "@/components/ui/button"
import { Section, SectionHeading } from "@/components/landing/section"
import { JsonLd } from "@/components/seo/json-ld"
import { BASE_URL, buildBreadcrumbSchema } from "@/lib/seo/schema"

type MethodologyBlock = { title: string; body: string }

const BLOCK_ICONS = [Sprout, FileSearch, RefreshCw]

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
 * Página de confiança do funil. Todo texto vem de `messages/*.json` e afirma
 * apenas o que a operação faz de fato — sem números, sem cadência prometida e
 * sem descrever ferramentas internas. Ver o brief da Task 8 antes de acrescentar
 * qualquer frase aqui.
 */
export default async function AboutPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "about" })
    const blocks = t.raw("methodology.blocks") as MethodologyBlock[]

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
                <p className="mt-4 text-lg leading-8 text-muted-foreground">{t("hero.subtitle")}</p>
            </Section>

            <Section tone="muted">
                <SectionHeading
                    eyebrow={t("methodology.eyebrow")}
                    title={t("methodology.title")}
                    intro={t("methodology.intro")}
                />

                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {blocks.map((block, index) => {
                        const Icon = BLOCK_ICONS[index % BLOCK_ICONS.length]
                        return (
                            <div
                                key={block.title}
                                className="h-full rounded-lg border border-border bg-card p-6 shadow-sm"
                            >
                                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent-strong">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground">{block.title}</h3>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">{block.body}</p>
                            </div>
                        )
                    })}
                </div>
            </Section>

            <Section width="narrow">
                <div className="grid gap-8 md:grid-cols-2">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{t("delivery.title")}</h2>
                        <p className="mt-3 leading-7 text-muted-foreground">{t("delivery.body")}</p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{t("limits.title")}</h2>
                        <p className="mt-3 leading-7 text-muted-foreground">{t("limits.body")}</p>
                    </div>
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
