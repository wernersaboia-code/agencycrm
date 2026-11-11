import { Globe2, Landmark, MapPin, Ship } from "lucide-react"
import { StaggerContainer, StaggerItem } from "@/components/motion"
import { getTranslations } from "next-intl/server"
import { cn } from "@/lib/utils"
import { CARD_RAIL, Section, SectionHeading, SPLIT_ASIDE, SPLIT_CARDS, SplitLayout } from "./section"
import type { LandingLocale } from "./types"

type ProfileCard = { title: string; body: string }

const PROFILE_ICONS = [Globe2, Landmark, Ship, MapPin]

export async function BuyerProfilesSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.einkaufsprofile" })
    const cards = t.raw("cards") as ProfileCard[]

    return (
        <Section tone="glow">
            <SplitLayout>
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />

            <StaggerContainer className={cn(SPLIT_CARDS, CARD_RAIL, "gap-4 sm:grid-cols-2")}>
                {cards.map((card, index) => {
                    const Icon = PROFILE_ICONS[index % PROFILE_ICONS.length]
                    return (
                        <StaggerItem key={card.title} className="w-[78%] shrink-0 snap-start rounded-lg border border-border bg-card p-5 sm:w-autotransition-[border-color,box-shadow] duration-300 hover:border-brand-accent/60 hover:shadow-md">
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent-strong">
                                <Icon className="h-5 w-5" />
                            </div>
                            <h3 className="font-semibold text-foreground">{card.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
                        </StaggerItem>
                    )
                })}
            </StaggerContainer>

            <p className={cn(SPLIT_ASIDE, "leading-7 text-muted-foreground")}>{t("close")}</p>
            </SplitLayout>
        </Section>
    )
}
