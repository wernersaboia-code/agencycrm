import { getTranslations } from "next-intl/server"
import type { LandingLocale } from "./types"

export async function DataQualitySection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.daten" })

    return <TextBlock eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />
}

export async function AdvantageSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.vorteil" })

    return <TextBlock eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />
}

function TextBlock({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
    return (
        <section className="border-t border-gray-100 bg-white py-14 md:py-16">
            <div className="container mx-auto max-w-3xl px-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
                    {eyebrow}
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                    {title}
                </h2>
                <p className="mt-4 leading-7 text-gray-600">{body}</p>
            </div>
        </section>
    )
}
