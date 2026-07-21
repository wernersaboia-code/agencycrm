import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/lib/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Section } from "./section"
import type { LandingLocale } from "./types"

export async function FinalCtaSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.cta" })

    return (
        <Section>
            {/* O fecho da página é o momento de marca: navy da logo em vez da
                inversão neutra de foreground/background. */}
            <div className="flex flex-col items-start justify-between gap-6 rounded-lg bg-brand p-8 text-brand-foreground md:flex-row md:items-center md:p-10">
                <div>
                    <h2 className="text-2xl font-bold md:text-3xl">{t("title")}</h2>
                    <p className="mt-2 max-w-xl leading-7 text-brand-foreground/75">{t("body")}</p>
                </div>
                <Button size="lg" className="shrink-0 bg-brand-foreground text-brand hover:bg-brand-foreground/90" asChild>
                    <Link href="/catalog">
                        {t("button")}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </Section>
    )
}
