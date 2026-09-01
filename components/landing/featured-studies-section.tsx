import { getTranslations } from "next-intl/server"
import { getFeaturedLists } from "@/actions/marketplace"
import { ListCard } from "@/components/marketplace/list-card"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

/**
 * Até quatro estudos marcados como destaque no admin.
 *
 * O limite é baixo de propósito: a home não é o catálogo, e uma grade grande
 * aqui compete com o resto da página em vez de abrir caminho para ela. Quem
 * quer ver tudo tem o catálogo a um clique.
 *
 * Sem destaque marcado, a seção devolve `null` e a home fica idêntica ao que
 * era — mesmo critério da amostra grátis. É o que permite esta seção ir ao ar
 * antes de o Werner escolher quais estudos destacar.
 */
export async function FeaturedStudiesSection({ locale }: { locale: LandingLocale }) {
    const listas = await getFeaturedLists(4)
    if (listas.length === 0) {
        return null
    }

    const t = await getTranslations({ locale, namespace: "landing.featured" })

    return (
        <Section tone="default">
            <SectionHeading title={t("title")} intro={t("intro")} />

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {listas.map((lista) => (
                    <ListCard key={lista.id} list={lista} />
                ))}
            </div>
        </Section>
    )
}
