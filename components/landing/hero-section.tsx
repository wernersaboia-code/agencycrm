import { ArrowRight, BadgeCheck, CheckCircle2, ShieldCheck } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/lib/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { LandingLocale } from "./types"

export async function HeroSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.hero" })

    return (
        <section className="border-b border-border hero-gradient">
            <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24">
                <div className="mx-auto max-w-3xl text-center">
                    <Badge className="mb-5 rounded-md border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700 hover:bg-indigo-50">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {t("badge")}
                    </Badge>

                    <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                        {t("title")}
                    </h1>

                    <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                        {t("subtitle")}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Button size="lg" className="bg-indigo-600 text-white hover:bg-indigo-700" asChild>
                            <Link href="/catalog">
                                {t("ctaPrimary")}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link href={locale === "de" ? "#ablauf" : "#como-funciona"}>{t("ctaSecondary")}</Link>
                        </Button>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                        <TrustNote icon={CheckCircle2} text={t("trust1")} />
                        <TrustNote icon={ShieldCheck} text={t("trust2")} />
                        <TrustNote icon={BadgeCheck} text={t("trust3")} />
                    </div>
                </div>
            </div>
        </section>
    )
}

function TrustNote({
    icon: Icon,
    text,
}: {
    icon: React.ComponentType<{ className?: string }>
    text: string
}) {
    return (
        <span className="inline-flex items-center gap-2">
            <Icon className="h-4 w-4 text-indigo-600" />
            {text}
        </span>
    )
}
