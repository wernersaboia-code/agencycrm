import { getTranslations } from "next-intl/server"
import { getFeaturedLists } from "@/actions/marketplace"
import { Section, SectionHeading } from "./section"
import { FeaturedStudiesShowcase, type FeaturedStudy } from "./featured-studies-showcase"
import type { LandingLocale } from "./types"

/**
 * Estudos marcados como destaque no admin, num showcase interativo (um por vez,
 * avanço automático, clicável).
 *
 * O limite é baixo de propósito: a home não é o catálogo, e uma grade grande
 * aqui compete com o resto da página em vez de abrir caminho para ela. Quem
 * quer ver tudo tem o catálogo a um clique.
 *
 * Sem destaque marcado, a seção devolve `null` — mesmo critério da amostra
 * grátis. É o que permite esta seção ir ao ar antes de o Werner escolher quais
 * estudos destacar.
 */
export async function FeaturedStudiesSection({ locale }: { locale: LandingLocale }) {
    const listas = await getFeaturedLists(4)
    if (listas.length === 0) {
        return null
    }

    const t = await getTranslations({ locale, namespace: "landing.featured" })
    const tLinks = await getTranslations({ locale, namespace: "landing.sectionLinks" })

    const studies: FeaturedStudy[] = listas.map((lista) => ({
        id: lista.id,
        name: lista.name,
        slug: lista.slug,
        description: lista.description,
        countries: lista.countries,
        industries: lista.industries,
        totalLeads: lista.totalLeads,
        price: lista.price,
        currency: lista.currency,
    }))

    return (
        <Section tone="muted">
            <SectionHeading
                title={t("title")}
                intro={t("intro")}
                action={{ href: "/catalog", label: tLinks("allStudies") }}
            />

            <div className="mt-8">
                <FeaturedStudiesShowcase studies={studies} />
            </div>
        </Section>
    )
}
