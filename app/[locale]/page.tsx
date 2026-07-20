import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { alternatesFor } from "@/lib/i18n/alternates"
import type { Locale } from "@/lib/i18n/locales"
import { toLandingLocale } from "@/components/landing/types"
import { HeroSection } from "@/components/landing/hero-section"
import { IntroSection } from "@/components/landing/intro-section"
import { TargetMarketsSection } from "@/components/landing/target-markets-section"
import { BuyerProfilesSection } from "@/components/landing/buyer-profiles-section"
import { DeliverablesSection } from "@/components/landing/deliverables-section"
import { AdvantageSection, DataQualitySection } from "@/components/landing/text-sections"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { StatsSection } from "@/components/landing/stats-section"
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
            locale: "pt_BR",
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
            <StatsSection locale={locale} />
            <BlogTeaserSection locale={locale} />
            <FinalCtaSection locale={locale} />
        </div>
    )
}
