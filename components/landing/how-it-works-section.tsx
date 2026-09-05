import { Download, Search, ShieldCheck } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/motion"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

type Step = { title: string; body: string; detail: string }
type Fact = { label: string; body: string }

const STEP_ICONS = [Search, ShieldCheck, Download]

/**
 * O percurso do catálogo ao PDF, e — abaixo dele — os fatos práticos da compra.
 *
 * A faixa de fatos existe porque as quatro perguntas que alguém faz antes de
 * pagar (em que formato chega, quando chega, como se paga, e o que acontece se
 * eu fechar a página) só tinham resposta no `/faq`, página que quase ninguém
 * abre ANTES de comprar.
 *
 * Ela é `<dl>` sem card e sem ícone de propósito: com moldura viraria um
 * segundo conjunto de cartões disputando atenção com os três passos, que são o
 * elemento principal da seção. Rótulo curto e uma linha, para ler de relance.
 *
 * O texto dos fatos é conferido contra o código, não contra o que soa bem —
 * ver a tabela de apuração em
 * `docs/superpowers/specs/2026-09-05-como-funciona-informativa-design.md`.
 * Dois limites que aquela tabela fixou e que se perdem com facilidade ao
 * reescrever a cópia:
 *
 *   - a entrega NÃO é "imediata": o Mercado Pago tem estado pendente explícito
 *     (`checkout.mpPending`), e quem libera a compra é a transição
 *     `pending -> paid` do `lib/checkout/fulfillment.ts`. A formulação honesta
 *     é "assim que o pagamento é confirmado";
 *   - o provedor de pagamento NÃO se nomeia aqui. Ele é ligado por variável de
 *     ambiente (`isStripeConfigured`, `MERCADOPAGO_ACCESS_TOKEN`), e esta
 *     página é estática: nomear um provedor faz o texto virar mentira no dia em
 *     que o env mudar.
 */
export async function HowItWorksSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.howItWorks" })
    const steps = t.raw("steps") as Step[]
    const facts = t.raw("facts") as Fact[]

    // FadeInView renderiza um div; envolvê-lo na Section devolve a semântica de
    // <section> a esta parte da página sem perder a animação de entrada.
    return (
        <Section id={locale === "de" ? "ablauf" : "como-funciona"}>
            <FadeInView direction="up">
                <SectionHeading eyebrow={t("eyebrow")} title={t("title")} centered />

                <StaggerContainer className="mt-10 grid gap-4 md:grid-cols-3">
                    {steps.map((step, index) => {
                        const Icon = STEP_ICONS[index % STEP_ICONS.length]
                        return (
                            <StaggerItem key={step.title}>
                                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-vitrine">
                                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent-strong">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.body}</p>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                        {step.detail}
                                    </p>
                                </div>
                            </StaggerItem>
                        )
                    })}
                </StaggerContainer>

                <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-border pt-10 md:grid-cols-4">
                    {facts.map((fact) => (
                        <div key={fact.label}>
                            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-strong">
                                {fact.label}
                            </dt>
                            <dd className="mt-2 text-sm leading-6 text-muted-foreground">{fact.body}</dd>
                        </div>
                    ))}
                </dl>
            </FadeInView>
        </Section>
    )
}
