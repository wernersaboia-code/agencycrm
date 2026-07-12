import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import type { LandingLocale } from "./types"

export async function FinalCtaSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.cta" })

    return (
        <section className="bg-white py-14">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-start justify-between gap-6 rounded-xl bg-gray-950 p-8 text-white md:flex-row md:items-center md:p-10">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t("title")}</h2>
                        <p className="mt-2 max-w-xl leading-7 text-gray-300">{t("body")}</p>
                    </div>
                    <Button size="lg" className="shrink-0 bg-white text-gray-950 hover:bg-gray-100" asChild>
                        <Link href="/catalog">
                            {t("button")}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    )
}
