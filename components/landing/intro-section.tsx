import { getTranslations } from "next-intl/server"
import type { LandingLocale } from "./types"

export async function IntroSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.intro" })

    return (
        <section className="bg-background py-14 md:py-16">
            <div className="container mx-auto max-w-3xl px-4">
                <p className="text-lg font-medium leading-8 text-foreground">{t("lede")}</p>
                <p className="mt-5 leading-7 text-muted-foreground">{t("p1")}</p>
                <p className="mt-4 leading-7 text-muted-foreground">{t("p2")}</p>
            </div>
        </section>
    )
}
