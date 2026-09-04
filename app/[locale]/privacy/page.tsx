import type { Metadata } from "next"
import { getFormatter, getTranslations } from "next-intl/server"
import { getLegalDocument } from "@/content/legal"
import { alternatesFor } from "@/lib/i18n/alternates"
import type { Locale } from "@/lib/i18n/locales"
import { robotsForPath } from "@/lib/seo/indexability"
import { LegalDocumentView } from "@/components/legal/legal-document"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const doc = getLegalDocument("privacy", locale as Locale)

    // Saiu o robots: { index: false } fixo que existia antes. Politica de
    // privacidade com noindex enfraquece justamente a pagina que deveria gerar
    // confianca — nos idiomas que TEM o documento. Onde ele nao existe e a
    // pagina cai no portugues, o noindex volta: e o texto errado sob a URL.
    return {
        title: doc.title,
        alternates: alternatesFor("/privacy", locale as Locale),
        robots: robotsForPath("/privacy", locale),
    }
}

export default async function PrivacyPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const doc = getLegalDocument("privacy", locale as Locale)
    const format = await getFormatter()
    const t = await getTranslations("legal")

    const data = format.dateTime(new Date(`${doc.lastUpdated}T00:00:00Z`), {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    })

    return <LegalDocumentView document={doc} lastUpdatedLabel={t("lastUpdated", { date: data })} />
}
