import { BadgeCheck, MessageCircle, ShoppingBag } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

type Stat = { value: string; label: string }

const STAT_ICONS = [ShoppingBag, BadgeCheck, MessageCircle]

/**
 * NÃO MONTADA hoje na landing — de propósito.
 *
 * Os valores vêm de `landing.zahlen.stats` nos arquivos de locale e são
 * PLACEHOLDERS do handoff (ver a chave `_placeholder`): "6+ listas vendidas",
 * "100% qualidade verificada", "24/7 suporte". Número inventado numa página
 * cuja promessa é dado verificado custa exatamente a confiança que ela tenta
 * construir.
 *
 * Para remontar: substituir os valores em messages/*.json por métricas reais
 * (ou ligar ao backend), remover a chave `_placeholder` e voltar a renderizar
 * <StatsSection /> em app/[locale]/page.tsx — o ritmo de fundo alternado
 * espera esta seção com tone="default".
 */
export async function StatsSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.zahlen" })
    const stats = t.raw("stats") as Stat[]

    return (
        <Section>
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} centered />

            <div className="mt-10 grid gap-4 md:grid-cols-3">
                {stats.map((stat, index) => {
                    const Icon = STAT_ICONS[index % STAT_ICONS.length]
                    return (
                        <div
                            key={stat.label}
                            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center shadow-sm"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent-strong">
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                                <div className="text-sm text-muted-foreground">{stat.label}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Section>
    )
}
