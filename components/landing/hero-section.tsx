import { ArrowRight, BadgeCheck, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/lib/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { LandingLocale } from "./types"

export async function HeroSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.hero" })

    return (
        <section className="relative overflow-hidden border-b border-border hero-gradient">
            {/* Aurora de marca: manchas de cor desfocadas atrás do conteúdo.
                A duna usa paisagem aqui; o projeto usa o azul da marca com um
                toque de teal (o verde da logo), o que dá a mesma sensação de
                "o herói é sobre nós" sem gradiente genérico. */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="vitrine-glow-blue absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 blur-3xl" />
                <div className="vitrine-glow-teal absolute -bottom-44 -left-24 h-[460px] w-[460px] blur-3xl" />
                <div className="absolute -bottom-44 -right-24 h-[460px] w-[460px] rounded-full bg-brand-accent-strong/20 blur-3xl" />
            </div>

            <div className="relative container mx-auto px-4 py-20 md:py-28 lg:py-32">
                <div className="mx-auto max-w-3xl text-center">
                    <Badge className="vitrine-chip mb-6 rounded-full border-0 px-4 py-1.5 backdrop-blur-sm">
                        <Sparkles className="h-3.5 w-3.5" />
                        {t("badge")}
                    </Badge>

                    <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                        {t("title")}
                    </h1>

                    <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                        {t("subtitle")}
                    </p>

                    <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                        <Button
                            size="lg"
                            className="vitrine-btn-primary h-12 rounded-full px-7 text-base font-semibold"
                            asChild
                        >
                            <Link href="/catalog">
                                {t("ctaPrimary")}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-12 rounded-full px-7 text-base font-semibold"
                            asChild
                        >
                            <Link href={locale === "de" ? "#ablauf" : "#como-funciona"}>{t("ctaSecondary")}</Link>
                        </Button>
                    </div>

                    <div className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
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
