import { getTranslations } from "next-intl/server"
import type { LandingLocale } from "@/components/landing/types"
import { FaqAccordion, type FaqEntry } from "@/components/faq/faq-accordion"
import { FaqContactForm, type FaqFormLabels } from "@/components/faq/faq-contact-form"

export async function FaqPageContent({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "faq" })
    // As respostas em faq.items são definitivas, incluindo a de LGPD/GDPR
    // (lib/seo/schema.test.ts guarda a integridade desse conteúdo).
    const items = t.raw("items") as FaqEntry[]

    const labels: FaqFormLabels = {
        title: t("form.title"),
        subtitle: t("form.subtitle"),
        name: t("form.name"),
        company: t("form.company"),
        email: t("form.email"),
        subject: t("form.subject"),
        message: t("form.message"),
        consent: t.raw("form.consent") as string,
        submit: t("form.submit"),
        submitting: t("form.submitting"),
        success: t("form.success"),
        error: t("form.error"),
        rateLimited: t("form.rateLimited"),
        errors: {
            name: t("form.errors.name"),
            email: t("form.errors.email"),
            subject: t("form.errors.subject"),
            message: t("form.errors.message"),
            consent: t("form.errors.consent"),
        },
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto max-w-3xl px-4 py-14 md:py-16">
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    {t("page.title")}
                </h1>
                <p className="mt-3 text-lg leading-8 text-muted-foreground">{t("page.subtitle")}</p>

                <div className="mt-10">
                    <FaqAccordion items={items} />
                </div>

                <div className="mt-14 rounded-xl border border-border bg-muted/40 p-6 md:p-8">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {labels.title}
                    </h2>
                    <p className="mt-2 leading-7 text-muted-foreground">{labels.subtitle}</p>

                    <div className="mt-6">
                        <FaqContactForm locale={locale} labels={labels} />
                    </div>
                </div>
            </div>
        </div>
    )
}
