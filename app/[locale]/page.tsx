import type { Metadata } from "next"
import { Suspense } from "react"
import { hasLocale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { routing } from "@/lib/i18n/routing"
import { alternatesFor } from "@/lib/i18n/alternates"
import { ogLocaleFor, type Locale } from "@/lib/i18n/locales"
import { toLandingLocale } from "@/components/landing/types"
import { HeroSection } from "@/components/landing/hero-section"
import { IntroSection } from "@/components/landing/intro-section"
import { TargetMarketsSection } from "@/components/landing/target-markets-section"
import { BuyerProfilesSection } from "@/components/landing/buyer-profiles-section"
import { DeliverablesSection } from "@/components/landing/deliverables-section"
import { FeaturedStudiesSection } from "@/components/landing/featured-studies-section"
import { FreeSampleSection } from "@/components/landing/free-sample-section"
import { AdvantageSection, DataQualitySection } from "@/components/landing/text-sections"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { BlogTeaserSection } from "@/components/landing/blog-teaser-section"
import { FinalCtaSection } from "@/components/landing/final-cta-section"

function SectionFallback({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-muted/30 ${className ?? "h-64"}`} />
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params

    // Ver o comentário em `layout.tsx`: locale inválido aqui vira 500 no lugar
    // de 404, porque a metadata roda antes do `notFound()`.
    if (!hasLocale(routing.locales, locale)) {
        return {}
    }

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
            <Suspense fallback={<SectionFallback className="h-80" />}>
                <HeroSection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-64" />}>
                <IntroSection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-96" />}>
                <TargetMarketsSection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-96" />}>
                <BuyerProfilesSection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-96" />}>
                <DeliverablesSection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-96" />}>
                <FeaturedStudiesSection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-64" />}>
                <FreeSampleSection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-48" />}>
                <DataQualitySection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-48" />}>
                <AdvantageSection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-96" />}>
                <HowItWorksSection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-96" />}>
                <BlogTeaserSection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-96" />}>
                <FinalCtaSection locale={locale} />
            </Suspense>
        </div>
    )
}
