import { Globe2, Landmark, MapPin, Ship } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

type ProfileCard = { title: string; body: string }

const PROFILE_ICONS = [Globe2, Landmark, Ship, MapPin]

export async function BuyerProfilesSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.einkaufsprofile" })
    const cards = t.raw("cards") as ProfileCard[]

    return (
        <Section tone="muted" width="narrow">
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {cards.map((card, index) => {
                    const Icon = PROFILE_ICONS[index % PROFILE_ICONS.length]
                    return (
                        <div key={card.title} className="rounded-lg border border-border bg-card p-5">
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent-strong">
                                <Icon className="h-5 w-5" />
                            </div>
                            <h3 className="font-semibold text-foreground">{card.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
                        </div>
                    )
                })}
            </div>

            <p className="mt-6 leading-7 text-muted-foreground">{t("close")}</p>
        </Section>
    )
}
