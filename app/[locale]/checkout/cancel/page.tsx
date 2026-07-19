import type { Metadata } from "next"
import { Link } from "@/lib/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RotateCcw, ShieldAlert, ShoppingCart } from "lucide-react"

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("checkout")

    return {
        title: t("cancelMetaTitle"),
        description: t("cancelMetaDescription"),
    }
}

export default async function CancelPage() {
    const t = await getTranslations("checkout")

    return (
        <div className="min-h-[70vh] bg-muted/40 px-4 py-16">
            <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950">
                    <ShieldAlert className="h-9 w-9 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                </div>

                <h1 className="mb-2 text-2xl font-bold text-foreground">{t("cancelTitle")}</h1>
                <p className="mb-8 text-sm text-muted-foreground">{t("cancelSubtitle")}</p>

                <div className="space-y-3">
                    <Button className="h-12 w-full bg-brand text-brand-foreground hover:bg-brand-hover" asChild>
                        <Link href="/checkout">
                            <RotateCcw className="h-5 w-5" aria-hidden="true" />
                            {t("cancelRetry")}
                        </Link>
                    </Button>

                    <Button variant="outline" className="h-12 w-full" asChild>
                        <Link href="/cart">
                            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                            {t("cancelReviewCart")}
                        </Link>
                    </Button>

                    <Button variant="ghost" className="h-12 w-full" asChild>
                        <Link href="/catalog">
                            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                            {t("cancelBackToCatalog")}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
