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

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations({ locale: "de", namespace: "landing.meta" })

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: "/de",
            languages: {
                "pt-BR": "/",
                de: "/de",
                "x-default": "/",
            },
        },
        openGraph: {
            title: t("title"),
            description: t("description"),
            locale: "de_DE",
        },
    }
}

export default function GermanLandingPage() {
    return (
        <div className="min-h-screen bg-white text-gray-950">
            <HeroSection locale="de" />
            <IntroSection locale="de" />
            <TargetMarketsSection locale="de" />
            <BuyerProfilesSection locale="de" />
            <DeliverablesSection locale="de" />
            <DataQualitySection locale="de" />
            <AdvantageSection locale="de" />
            <HowItWorksSection locale="de" />
            <StatsSection locale="de" />
            <BlogTeaserSection locale="de" />
            <FinalCtaSection locale="de" />
        </div>
    )
}
