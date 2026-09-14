import { Download, Search, ShieldCheck } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/motion"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

type Step = { title: string; body: string }

const STEP_ICONS = [Search, ShieldCheck, Download]

export async function HowItWorksSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.howItWorks" })
    const steps = t.raw("steps") as Step[]

    // FadeInView renderiza um div; envolvê-lo na Section devolve a semântica de
    // <section> a esta parte da página sem perder a animação de entrada.
    return (
        <Section id={locale === "de" ? "ablauf" : "como-funciona"} tone="muted">
            <FadeInView direction="up">
                <SectionHeading eyebrow={t("eyebrow")} title={t("title")} centered />

                <StaggerContainer className="mt-10 grid gap-4 md:grid-cols-3">
                    {steps.map((step, index) => {
                        const Icon = STEP_ICONS[index % STEP_ICONS.length]
                        return (
                            <StaggerItem key={step.title}>
                                <div className="h-full rounded-lg border border-border bg-card p-6 shadow-sm">
                                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent-strong">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.body}</p>
                                </div>
                            </StaggerItem>
                        )
                    })}
                </StaggerContainer>
            </FadeInView>
        </Section>
    )
}
