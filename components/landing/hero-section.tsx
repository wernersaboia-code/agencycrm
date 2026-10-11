import { ArrowRight, BadgeCheck, CheckCircle2, Gift, ShieldCheck } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { getAmostraAtiva } from "@/lib/free-sample/amostra-ativa"
import { freeSampleAnchor } from "./free-sample-section"
import { Link } from "@/lib/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { LandingLocale } from "./types"

export async function HeroSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.hero" })
    const tAmostra = await getTranslations({ locale, namespace: "landing.freeSample" })
    // Mesma regra da seção: sem amostra ativa no super-admin, sem destaque.
    const amostra = await getAmostraAtiva()

    return (
        <section className="border-b border-border hero-gradient">
            <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24">
                <div className="mx-auto max-w-3xl text-center">
                    <Badge className="mb-5 rounded-md border-brand-accent/40 bg-brand-accent/15 px-3 py-1 text-brand-accent-strong hover:bg-brand-accent/15">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {t("badge")}
                    </Badge>

                    <h1 className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
                        {t("title")}
                    </h1>

                    <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                        {t("subtitle")}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Button size="lg" className="bg-brand text-brand-foreground hover:bg-brand-hover" asChild>
                            <Link href="/catalog">
                                {t("ctaPrimary")}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link href={locale === "de" ? "#ablauf" : "#como-funciona"}>{t("ctaSecondary")}</Link>
                        </Button>
                    </div>

                    {amostra && (
                        <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-4 rounded-xl border-2 border-brand-accent bg-brand-accent/10 p-5 text-left shadow-lg shadow-brand-accent/20 sm:flex-row sm:p-6">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-accent/25">
                                <Gift className="h-6 w-6 text-brand-accent-strong" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent-strong">
                                    {tAmostra("eyebrow")}
                                </p>
                                <p className="mt-1 text-lg font-semibold text-foreground">{tAmostra("title")}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{tAmostra("fileNote")}</p>
                            </div>
                            <Button size="lg" className="shrink-0 bg-brand text-brand-foreground hover:bg-brand-hover" asChild>
                                <Link href={`#${freeSampleAnchor(locale)}`}>
                                    {tAmostra("cta")}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    )}

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
            <Icon className="h-4 w-4 text-brand-accent-strong" />
            {text}
        </span>
    )
}
