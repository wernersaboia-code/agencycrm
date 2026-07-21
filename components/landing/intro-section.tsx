import { getTranslations } from "next-intl/server"
import { Section } from "./section"
import type { LandingLocale } from "./types"

export async function IntroSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.intro" })

    return (
        <Section width="narrow">
            <p className="text-lg font-medium leading-8 text-foreground">{t("lede")}</p>
            <p className="mt-5 leading-7 text-muted-foreground">{t("p1")}</p>
            <p className="mt-4 leading-7 text-muted-foreground">{t("p2")}</p>
        </Section>
    )
}
