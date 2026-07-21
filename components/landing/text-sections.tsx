import { getTranslations } from "next-intl/server"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

export async function DataQualitySection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.daten" })

    return <TextBlock eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />
}

export async function AdvantageSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.vorteil" })

    return <TextBlock eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />
}

function TextBlock({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
    return (
        <Section width="narrow">
            <SectionHeading eyebrow={eyebrow} title={title} intro={body} />
        </Section>
    )
}
