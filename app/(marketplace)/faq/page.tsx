import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { FaqPageContent } from "@/components/faq/faq-page-content"

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations({ locale: "pt", namespace: "faq.page" })

    return {
        title: t("metaTitle"),
        description: t("metaDescription"),
        alternates: {
            canonical: "/faq",
            languages: {
                "pt-BR": "/faq",
                de: "/de/faq",
                "x-default": "/faq",
            },
        },
    }
}

export default function FaqPage() {
    return <FaqPageContent locale="pt" />
}
