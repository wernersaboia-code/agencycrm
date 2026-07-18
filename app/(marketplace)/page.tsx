import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
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
import { SyncLocaleCookie } from "@/components/marketplace/sync-locale-cookie"

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations({ locale: "pt", namespace: "landing.meta" })

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: "/",
            languages: {
                "pt-BR": "/",
                de: "/de",
                "x-default": "/",
            },
        },
        openGraph: {
            title: t("title"),
            description: t("description"),
            locale: "pt_BR",
        },
    }
}

export default function EasyProspectHome() {
    return (
        <div className="min-h-screen bg-white text-gray-950">
            <SyncLocaleCookie locale="pt" />
            <HeroSection locale="pt" />
            <IntroSection locale="pt" />
            <TargetMarketsSection locale="pt" />
            <BuyerProfilesSection locale="pt" />
            <DeliverablesSection locale="pt" />
            <DataQualitySection locale="pt" />
            <AdvantageSection locale="pt" />
            <HowItWorksSection locale="pt" />
            <StatsSection locale="pt" />
            <BlogTeaserSection locale="pt" />
            <FinalCtaSection locale="pt" />
        </div>
    )
}
