import { Globe2, Landmark, MapPin, Ship } from "lucide-react"
import { getTranslations } from "next-intl/server"
import type { LandingLocale } from "./types"

type ProfileCard = { title: string; body: string }

const PROFILE_ICONS = [Globe2, Landmark, Ship, MapPin]

export async function BuyerProfilesSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.einkaufsprofile" })
    const cards = t.raw("cards") as ProfileCard[]

    return (
        <section className="border-t border-gray-100 bg-white py-14 md:py-16">
            <div className="container mx-auto max-w-3xl px-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
                    {t("eyebrow")}
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                    {t("title")}
                </h2>
                <p className="mt-4 leading-7 text-gray-600">{t("intro")}</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {cards.map((card, index) => {
                        const Icon = PROFILE_ICONS[index % PROFILE_ICONS.length]
                        return (
                            <div key={card.title} className="rounded-lg border border-gray-200 bg-white p-5">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold text-gray-950">{card.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-500">{card.body}</p>
                            </div>
                        )
                    })}
                </div>

                <p className="mt-6 leading-7 text-gray-600">{t("close")}</p>
            </div>
        </section>
    )
}
