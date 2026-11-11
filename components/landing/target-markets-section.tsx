import { StaggerContainer, StaggerItem } from "@/components/motion"
import { getTranslations } from "next-intl/server"
import { FlagIcon } from "@/components/ui/flag-icon"
import { cn } from "@/lib/utils"
import { CARD_RAIL, Section, SectionHeading, SPLIT_ASIDE, SPLIT_CARDS, SplitLayout } from "./section"
import type { LandingLocale } from "./types"

type Region = { flag: string; title: string; countries: string }

export async function TargetMarketsSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.zielmaerkte" })
    const regions = t.raw("regions") as Region[]

    return (
        <Section tone="glow">
            <SplitLayout>
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />

            <StaggerContainer className={cn(SPLIT_CARDS, CARD_RAIL, "gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2")}>
                {regions.map((region) => (
                    <StaggerItem
                        key={region.title}
                        className="flex w-[72%] shrink-0 snap-start items-center gap-4 rounded-lg sm:w-auto border border-border bg-card p-4 transition-[border-color,box-shadow] duration-300 hover:border-brand-accent/60 hover:shadow-md"
                    >
                        <FlagIcon code={region.flag} size="lg" />
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">{region.title}</h3>
                            <p className="text-xs text-muted-foreground">{region.countries}</p>
                        </div>
                    </StaggerItem>
                ))}
            </StaggerContainer>

            <div className={cn(SPLIT_ASIDE, "rounded-r-lg border border-l-[3px] border-border border-l-brand-accent-strong bg-muted/40 px-5 py-4 text-sm leading-6 text-muted-foreground")}>
                {t("note")}
            </div>
            </SplitLayout>
        </Section>
    )
}
