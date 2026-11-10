import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/lib/i18n/navigation"
import { Button } from "@/components/ui/button"
import { MobileCatalogBarShell } from "./mobile-catalog-bar-shell"
import type { LandingLocale } from "./types"

/**
 * Barra fixa do celular com o caminho para o catálogo.
 *
 * No celular a home tem cerca de doze telas, e o botão do catálogo só existia
 * no topo e no fim. O rótulo é o mesmo do botão do hero, de propósito: não é
 * texto novo.
 */
export async function MobileCatalogBar({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.hero" })

    return (
        <MobileCatalogBarShell>
            <Button size="lg" className="w-full bg-brand text-brand-foreground hover:bg-brand-hover" asChild>
                <Link href="/catalog">
                    {t("ctaPrimary")}
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </Button>
        </MobileCatalogBarShell>
    )
}
