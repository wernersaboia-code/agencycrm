import { CheckCircle2, FileText } from "lucide-react"
import { getTranslations } from "next-intl/server"
import type { LandingLocale } from "./types"

export async function DeliverablesSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.lieferumfang" })
    const items = t.raw("items") as string[]

    return (
        <section className="border-t border-border bg-background py-14 md:py-16">
            <div className="container mx-auto max-w-3xl px-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
                    {t("eyebrow")}
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    {t("title")}
                </h2>

                <div className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50/70 p-6">
                    <h3 className="flex items-center gap-2.5 font-semibold text-foreground">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        {t("reportTitle")}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("reportBody")}</p>
                </div>

                <p className="mt-6 leading-7 text-muted-foreground">{t("listIntro")}</p>

                <ul className="mt-4 space-y-3">
                    {items.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                            {item}
                        </li>
                    ))}
                </ul>

                <p className="mt-6 leading-7 text-muted-foreground">{t("close")}</p>
            </div>
        </section>
    )
}
