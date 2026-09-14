import { CheckCircle2, FileText } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

export async function DeliverablesSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.lieferumfang" })
    const items = t.raw("items") as string[]

    return (
        <Section tone="muted" width="narrow">
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

            <div className="mt-6 rounded-lg border border-brand-accent/40 bg-brand-accent/10 p-6">
                <h3 className="flex items-center gap-2.5 font-semibold text-foreground">
                    <FileText className="h-5 w-5 text-brand-accent-strong" />
                    {t("reportTitle")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("reportBody")}</p>
            </div>

            <p className="mt-6 leading-7 text-muted-foreground">{t("listIntro")}</p>

            <ul className="mt-4 space-y-3">
                {items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent-strong" />
                        {item}
                    </li>
                ))}
            </ul>

            <p className="mt-6 leading-7 text-muted-foreground">{t("close")}</p>
        </Section>
    )
}
