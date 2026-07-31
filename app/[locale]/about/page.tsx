import type { Metadata } from "next"
import { ArrowRight, Check } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link, getPathname } from "@/lib/i18n/navigation"
import { alternatesFor } from "@/lib/i18n/alternates"
import type { Locale } from "@/lib/i18n/locales"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/landing/section"
import { JsonLd } from "@/components/seo/json-ld"
import { BASE_URL, buildBreadcrumbSchema } from "@/lib/seo/schema"
import { getAboutDocument, type AboutBlock, type AboutSection } from "@/content/about"

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
 * Página de confiança do funil ("Por que Easy Prospect").
 *
 * O texto NÃO mora aqui nem em `messages/*.json`: é transcrição literal do
 * documento do sócio, um arquivo por idioma em `content/about`. Ele pediu
 * palavra por palavra, então não reescreva daqui — mexa no documento e
 * transcreva de novo.
 *
 * Só a moldura é do produto: título de SEO, migalha de pão e os dois botões da
 * chamada final, que são navegação e não texto dele. Por isso continuam em
 * `messages`. O alemão não tem seção de chamada no documento; os botões
 * aparecem mesmo assim, porque são a saída da página.
 */
export default async function AboutPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "about" })
    const doc = getAboutDocument(locale as Locale)

    const cta = doc.sections.find((section) => section.id === "cta")
    const corpo = doc.sections.filter((section) => section.id !== "cta")

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
                    {doc.eyebrow}
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    {doc.title}
                </h1>
                <div className="mt-4 space-y-4">
                    {doc.intro.map((bloco, i) => (
                        <Bloco key={i} bloco={bloco} destaque />
                    ))}
                </div>
            </Section>

            {corpo.map((section, i) => (
                <Section key={section.id} width="narrow" tone={i % 2 === 0 ? "muted" : undefined}>
                    <h2 className="text-2xl font-bold text-foreground">{section.heading}</h2>
                    {section.sub && (
                        <p className="mt-2 text-lg font-medium text-brand-accent-strong">{section.sub}</p>
                    )}
                    <div className="mt-6 space-y-4">
                        {section.blocks.map((bloco, j) => (
                            <Bloco key={j} bloco={bloco} />
                        ))}
                    </div>
                </Section>
            ))}

            <Section>
                <div className="flex flex-col items-start justify-between gap-6 rounded-lg bg-brand p-8 text-brand-foreground md:flex-row md:items-center md:p-10">
                    <div>
                        {cta && <h2 className="text-2xl font-bold md:text-3xl">{cta.heading}</h2>}
                        {cta && <Chamada section={cta} />}
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

function Chamada({ section }: { section: AboutSection }) {
    const texto = section.blocks
        .filter((bloco): bloco is Extract<AboutBlock, { kind: "paragrafo" }> => bloco.kind === "paragrafo")
        .map((bloco) => bloco.texto)

    return (
        <div className="mt-2 max-w-xl space-y-2">
            {texto.map((paragrafo) => (
                <p key={paragrafo} className="leading-7 text-brand-foreground/75">
                    {paragrafo}
                </p>
            ))}
        </div>
    )
}

function Bloco({ bloco, destaque = false }: { bloco: AboutBlock; destaque?: boolean }) {
    if (bloco.kind === "paragrafo") {
        return (
            <p className={destaque ? "text-lg leading-8 text-muted-foreground" : "leading-7 text-muted-foreground"}>
                {bloco.texto}
            </p>
        )
    }

    if (bloco.kind === "lista") {
        return (
            <ul className="grid gap-3 sm:grid-cols-2">
                {bloco.itens.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                        <Check
                            className="mt-1.5 h-4 w-4 shrink-0 text-brand-accent-strong"
                            aria-hidden="true"
                        />
                        <span className="leading-7 text-muted-foreground">{item}</span>
                    </li>
                ))}
            </ul>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bloco.cartoes.map((cartao) => (
                <div
                    key={cartao.titulo}
                    className="h-full rounded-lg border border-border bg-card p-6 shadow-sm"
                >
                    <h3 className="text-lg font-semibold text-foreground">{cartao.titulo}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{cartao.texto}</p>
                </div>
            ))}
        </div>
    )
}
