import type { Metadata } from "next"
import { getFormatter } from "next-intl/server"
import { getLegalDocument } from "@/content/legal"
import { alternatesFor } from "@/lib/i18n/alternates"
import type { Locale } from "@/lib/i18n/locales"
import { LegalDocumentView } from "@/components/legal/legal-document"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const doc = getLegalDocument("privacy", locale as Locale)

    // Sai o robots: { index: false } que existia antes. Politica de privacidade
    // com noindex enfraquece justamente a pagina que deveria gerar confianca.
    return {
        title: doc.title,
        alternates: alternatesFor("/privacy", locale as Locale),
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

    const data = format.dateTime(new Date(`${doc.lastUpdated}T00:00:00Z`), {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    })

    return <LegalDocumentView document={doc} lastUpdatedLabel={`Última atualização: ${data}`} />
}
