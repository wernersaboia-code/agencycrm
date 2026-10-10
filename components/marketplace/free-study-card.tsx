// components/marketplace/free-study-card.tsx
import { getLocale, getTranslations } from "next-intl/server"
import { Download, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * O estudo gratuito de quem tem conta, no topo de Minhas compras.
 *
 * O botão é um link comum e não um fetch: a rota redireciona para a URL
 * assinada do arquivo, e o navegador cuida do download sozinho.
 */
export async function FreeStudyCard() {
    const t = await getTranslations("freeStudy")
    const locale = await getLocale()

    return (
        <section className="mb-6 flex flex-col gap-4 rounded-lg border border-brand-accent/40 bg-brand-accent/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card text-brand-accent-strong">
                    <Gift className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-foreground">{t("cardTitle")}</h2>
                        <span className="rounded-md bg-brand-accent/20 px-2 py-0.5 text-xs font-medium text-brand-accent-strong">
                            {t("cardBadge")}
                        </span>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("cardText")}</p>
                </div>
            </div>

            <Button className="shrink-0 bg-brand text-brand-foreground hover:bg-brand-hover" asChild>
                <a href={`/api/free-sample/account?lang=${locale}`}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {t("cardCta")}
                </a>
            </Button>
        </section>
    )
}
