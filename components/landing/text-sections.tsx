import { getTranslations } from "next-intl/server"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

/**
 * Duas seções de texto puro: qualidade dos dados e vantagem.
 *
 * Elas chegaram a ganhar um painel à direita, para entrarem no mesmo esqueleto
 * split das outras. O painel voltou atrás nas duas porque não havia conteúdo
 * próprio para ele: em `DataQualitySection` repetia o número de estudos e a
 * data de revisão que a faixa logo abaixo do hero já mostra, e em
 * `AdvantageSection` repetia literalmente o mesmo `t("body")` do parágrafo ao
 * lado — o mesmo texto duas vezes na tela.
 *
 * Enquanto não existir conteúdo real para a coluna da direita (um checklist
 * próprio, uma imagem da conferência, um dado que a faixa não mostre), a forma
 * honesta é a coluna estreita. Um painel premium com texto repetido não lê como
 * premium; lê como erro.
 */

export async function DataQualitySection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.daten" })

    return (
        <Section tone="muted" width="narrow">
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("body")} />
        </Section>
    )
}

export async function AdvantageSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.vorteil" })

    return (
        <Section tone="muted" width="narrow">
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("body")} />
        </Section>
    )
}
