import { getTranslations } from "next-intl/server"
import { getFeaturedLists } from "@/actions/marketplace"
import { ListCard } from "@/components/marketplace/list-card"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

/**
 * Uma vitrine curta dos estudos promovidos no admin. Sem nenhum destaque
 * publicado, a seção não deixa um bloco vazio na página inicial.
 */
export async function FeaturedStudiesSection({ locale }: { locale: LandingLocale }) {
    const lists = await getFeaturedLists(4)

    if (lists.length === 0) {
        return null
    }

    const t = await getTranslations({ locale, namespace: "landing.featured" })

    return (
        <Section tone="default">
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {lists.map((list) => (
                    <ListCard key={list.id} list={list} />
                ))}
            </div>
        </Section>
    )
}
