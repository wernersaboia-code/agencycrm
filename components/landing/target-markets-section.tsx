import { getTranslations } from "next-intl/server"
import { FlagIcon } from "@/components/ui/flag-icon"
import type { LandingLocale } from "./types"

type Region = { flag: string; title: string; countries: string }

export async function TargetMarketsSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.zielmaerkte" })
    const regions = t.raw("regions") as Region[]

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

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {regions.map((region) => (
                        <div
                            key={region.title}
                            className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
                        >
                            <FlagIcon code={region.flag} size="lg" />
                            <div>
                                <h3 className="text-sm font-semibold text-gray-950">{region.title}</h3>
                                <p className="text-xs text-gray-500">{region.countries}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-5 rounded-r-lg border border-l-[3px] border-gray-200 border-l-indigo-600 bg-gray-50 px-5 py-4 text-sm leading-6 text-gray-600">
                    {t("note")}
                </div>
            </div>
        </section>
    )
}
