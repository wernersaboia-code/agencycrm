import { getTranslations } from "next-intl/server"
import { getFeaturedLists } from "@/actions/marketplace"
import { StaggerContainer, StaggerItem } from "@/components/motion"
import { ListCard } from "@/components/marketplace/list-card"
import { getSetores } from "@/lib/marketplace/setores-servidor"
import { nomesDosSetoresDaLista } from "@/lib/marketplace/setores"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

/**
 * Uma vitrine curta dos estudos promovidos no admin. Sem nenhum destaque
 * publicado, a seção não deixa um bloco vazio na página inicial.
 */
export async function FeaturedStudiesSection({ locale }: { locale: LandingLocale }) {
    const [lists, setores] = await Promise.all([getFeaturedLists(4), getSetores()])

    if (lists.length === 0) {
        return null
    }

    const t = await getTranslations({ locale, namespace: "landing.featured" })

    return (
        <Section tone="glow">
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />

            <StaggerContainer className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {lists.map((list) => (
                    // min-w-0: o invólucro da animação é que vira item da grade,
                    // e sem isto a etiqueta de setor esticava o cartão para fora.
                    <StaggerItem key={list.id} className="min-w-0 [&>*]:h-full">
                        <ListCard list={{ ...list, industryNames: nomesDosSetoresDaLista(list.industries, setores, locale) }} />
                    </StaggerItem>
                ))}
            </StaggerContainer>
        </Section>
    )
}
