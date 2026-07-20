import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { alternatesFor } from "@/lib/i18n/alternates"
import type { Locale } from "@/lib/i18n/locales"
import { toLandingLocale } from "@/components/landing/types"
import { FaqPageContent } from "@/components/faq/faq-page-content"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "faq.page" })

    return {
        title: t("metaTitle"),
        description: t("metaDescription"),
        alternates: alternatesFor("/faq", locale as Locale),
    }
}

export default async function FaqPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    return <FaqPageContent locale={toLandingLocale(locale)} />
}
