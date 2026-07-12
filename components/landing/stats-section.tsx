import { BadgeCheck, MessageCircle, ShoppingBag } from "lucide-react"
import { getTranslations } from "next-intl/server"
import type { LandingLocale } from "./types"

type Stat = { value: string; label: string }

const STAT_ICONS = [ShoppingBag, BadgeCheck, MessageCircle]

// Os valores exibidos aqui vêm de landing.zahlen.stats nos arquivos de locale
// e são PLACEHOLDERS (ver chave _placeholder) até haver dados reais.
export async function StatsSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.zahlen" })
    const stats = t.raw("stats") as Stat[]

    return (
        <section className="bg-white py-14">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
                        {t("eyebrow")}
                    </p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                        {t("title")}
                    </h2>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {stats.map((stat, index) => {
                        const Icon = STAT_ICONS[index % STAT_ICONS.length]
                        return (
                            <div
                                key={stat.label}
                                className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-950">{stat.value}</div>
                                    <div className="text-sm text-gray-500">{stat.label}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
