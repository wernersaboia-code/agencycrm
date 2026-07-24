import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { alternatesFor } from "@/lib/i18n/alternates"
import { ogLocaleFor, type Locale } from "@/lib/i18n/locales"
import { toLandingLocale } from "@/components/landing/types"
import { HeroSection } from "@/components/landing/hero-section"
import { IntroSection } from "@/components/landing/intro-section"
import { TargetMarketsSection } from "@/components/landing/target-markets-section"
import { BuyerProfilesSection } from "@/components/landing/buyer-profiles-section"
import { DeliverablesSection } from "@/components/landing/deliverables-section"
import { AdvantageSection, DataQualitySection } from "@/components/landing/text-sections"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { BlogTeaserSection } from "@/components/landing/blog-teaser-section"
import { FinalCtaSection } from "@/components/landing/final-cta-section"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "landing.meta" })

    return {
        title: t("title"),
        description: t("description"),
        alternates: alternatesFor("/", locale as Locale),
        openGraph: {
            title: t("title"),
            description: t("description"),
            locale: ogLocaleFor(locale as Locale),
            // O merge de metadata do Next é raso: declarar `openGraph` aqui
            // substitui o do layout raiz inteiro, levando junto o `images`.
            // Sem esta linha a home é compartilhada sem imagem no LinkedIn,
            // WhatsApp e Slack — o `twitter:image` só sobrevive porque esta
            // página não declara um bloco `twitter`.
            images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
        },
    }
}

export default async function EasyProspectHome({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale: routeLocale } = await params
    const locale = toLandingLocale(routeLocale)

    return (
        <div className="min-h-screen bg-background text-foreground">
            <HeroSection locale={locale} />
            <IntroSection locale={locale} />
            <TargetMarketsSection locale={locale} />
            <BuyerProfilesSection locale={locale} />
            <DeliverablesSection locale={locale} />
            <DataQualitySection locale={locale} />
            <AdvantageSection locale={locale} />
            <HowItWorksSection locale={locale} />
            {/* Aqui existia uma StatsSection com números do handoff ("6+ listas
                vendidas", "100% qualidade verificada", "24/7 suporte"). Nenhum
                era real, então o componente e as mensagens (landing.zahlen)
                foram removidos: enquanto ficassem no repositório, bastava
                remontar a seção para publicar três afirmações falsas. Uma
                seção de números só volta com métrica medida. */}
            <BlogTeaserSection locale={locale} />
            <FinalCtaSection locale={locale} />
        </div>
    )
}
