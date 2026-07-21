import { getTranslations } from "next-intl/server"
import { FlagIcon } from "@/components/ui/flag-icon"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

type Region = { flag: string; title: string; countries: string }

export async function TargetMarketsSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.zielmaerkte" })
    const regions = t.raw("regions") as Region[]

    return (
        <Section width="narrow">
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {regions.map((region) => (
                    <div
                        key={region.title}
                        className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
                    >
                        <FlagIcon code={region.flag} size="lg" />
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">{region.title}</h3>
                            <p className="text-xs text-muted-foreground">{region.countries}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-5 rounded-r-lg border border-l-[3px] border-border border-l-brand-accent-strong bg-muted/40 px-5 py-4 text-sm leading-6 text-muted-foreground">
                {t("note")}
            </div>
        </Section>
    )
}
