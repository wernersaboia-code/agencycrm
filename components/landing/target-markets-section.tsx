import { getTranslations } from "next-intl/server"
import { FlagIcon } from "@/components/ui/flag-icon"
import type { LandingLocale } from "./types"

type Region = { flag: string; title: string; countries: string }

export async function TargetMarketsSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.zielmaerkte" })
    const regions = t.raw("regions") as Region[]

    return (
        <section className="border-t border-border bg-background py-14 md:py-16">
            <div className="container mx-auto max-w-3xl px-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
                    {t("eyebrow")}
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    {t("title")}
                </h2>
                <p className="mt-4 leading-7 text-muted-foreground">{t("intro")}</p>

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

                <div className="mt-5 rounded-r-lg border border-l-[3px] border-border border-l-indigo-600 bg-muted/40 px-5 py-4 text-sm leading-6 text-muted-foreground">
                    {t("note")}
                </div>
            </div>
        </section>
    )
}
