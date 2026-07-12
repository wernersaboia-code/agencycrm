import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { FaqPageContent } from "@/components/faq/faq-page-content"

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations({ locale: "de", namespace: "faq.page" })

    return {
        title: t("metaTitle"),
        description: t("metaDescription"),
        alternates: {
            canonical: "/de/faq",
            languages: {
                "pt-BR": "/faq",
                de: "/de/faq",
                "x-default": "/faq",
            },
        },
        openGraph: {
            locale: "de_DE",
        },
    }
}

export default function GermanFaqPage() {
    return <FaqPageContent locale="de" />
}
