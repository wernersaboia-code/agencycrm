import { Download, Search, ShieldCheck } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/motion"
import type { LandingLocale } from "./types"

type Step = { title: string; body: string }

const STEP_ICONS = [Search, ShieldCheck, Download]

export async function HowItWorksSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.howItWorks" })
    const steps = t.raw("steps") as Step[]

    return (
        <FadeInView direction="up" className="bg-muted/40 py-14 md:py-18" id={locale === "de" ? "ablauf" : "como-funciona"}>
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
                        {t("eyebrow")}
                    </p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        {t("title")}
                    </h2>
                </div>

                <StaggerContainer className="mt-10 grid gap-4 md:grid-cols-3">
                    {steps.map((step, index) => {
                        const Icon = STEP_ICONS[index % STEP_ICONS.length]
                        return (
                            <StaggerItem key={step.title}>
                                <div className="h-full rounded-lg border border-border bg-card p-6 shadow-sm">
                                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.body}</p>
                                </div>
                            </StaggerItem>
                        )
                    })}
                </StaggerContainer>
            </div>
        </FadeInView>
    )
}
