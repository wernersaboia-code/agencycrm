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
import { CatalogStatsSection } from "@/components/landing/catalog-stats-section"
import { TargetMarketsSection } from "@/components/landing/target-markets-section"
import { SectorsSection } from "@/components/landing/sectors-section"
import { DeliverablesSection } from "@/components/landing/deliverables-section"
import { FeaturedStudiesSection } from "@/components/landing/featured-studies-section"
import { FreeSampleSection } from "@/components/landing/free-sample-section"
import { AdvantageSection, DataQualitySection } from "@/components/landing/text-sections"
import { MethodSection } from "@/components/landing/method-section"
import { ShowcaseSection } from "@/components/landing/showcase-section"
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
            {/* Ritmo de fundo da página. O `tone` de cada seção mora no arquivo
                dela (ver `components/landing/section.tsx`), então a alternância
                só existe enquanto esta ordem e aqueles tones combinarem — e ela
                já tinha quebrado uma vez, com quatro `default` seguidos aqui no
                topo. A sequência correta, do hero para baixo:

                  intro          default
                  showcase       muted
                  deliverables   default
                  targetMarkets  muted
                  setores        default
                  featured       muted
                  freeSample     default
                  dataQuality    muted
                  method         DEEP (lead) — a única quebra tonal
                  advantage      muted
                  howItWorks     default
                  blog           muted
                  finalCta       default

                Ao inserir ou remover seção aqui, conferir os vizinhos.

                `featured` e `freeSample` devolvem `null` quando não há destaque
                marcado nem amostra ativa, e aí a alternância junta dois `muted`
                naquele ponto. É uma costura aceita: alternar por posição real
                exigiria a página ditar o tone, e o tone mora na seção de
                propósito (ver `section.tsx`). */}
            <Suspense fallback={<SectionFallback className="h-80" />}>
                <HeroSection locale={locale} />
            </Suspense>
            {/* Logo abaixo do hero, como a duna põe "10.6x / 37% / 4.8x": a
                primeira prova depois da promessa. São números de INVENTÁRIO,
                lidos do banco — nunca resultados prometidos. */}
            <Suspense fallback={<SectionFallback className="h-56" />}>
                <CatalogStatsSection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-64" />}>
                <IntroSection locale={locale} />
            </Suspense>
            {/* O showcase interativo vem logo depois do intro: é o que o visitante
                EXPLORA (mini-páginas que avançam e são clicáveis), na posição de
                destaque. Ele assumiu as quatro imagens estáticas que fechavam o
                antigo "O que está incluído" — mas não a lista de temas daquela
                seção, que continua logo abaixo e não tem cópia em lugar nenhum. */}
            <Suspense fallback={<SectionFallback className="h-[560px]" />}>
                <ShowcaseSection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-96" />}>
                <DeliverablesSection locale={locale} />
            </Suspense>
            <Suspense fallback={<SectionFallback className="h-96" />}>
                <TargetMarketsSection locale={locale} />
            </Suspense>
            {/* Depois do mapa: país e setor são as duas — e só duas — dimensões
                da busca do catálogo. A seção anterior aqui ("Perfis de compra")
                separava importadores por UE e Mercosul, o que contradizia o mapa
                logo acima e recortava o catálogo de um jeito que ele não
                sustenta (ver `sectors-section.tsx`). */}
            <Suspense fallback={<SectionFallback className="h-96" />}>
                <SectorsSection locale={locale} />
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
            {/* Entre "os dados são revisados" e a promessa de vantagem: primeiro
                o método (o que conferimos, o que não prometemos), depois o ganho. */}
            <Suspense fallback={<SectionFallback className="h-[780px]" />}>
                <MethodSection locale={locale} />
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
