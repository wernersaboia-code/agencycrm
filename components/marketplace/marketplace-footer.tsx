import Link from "next/link"
import { getTranslations } from "next-intl/server"

export async function MarketplaceFooter({ locale = "pt" }: { locale?: "pt" | "de" }) {
    const t = await getTranslations({ locale, namespace: "footer" })

    const homeHref = locale === "de" ? "/de" : "/"
    const howItWorksHref = locale === "de" ? "/de#ablauf" : "/#como-funciona"
    const faqHref = locale === "de" ? "/de/faq" : "/faq"

    return (
        <footer className="border-t bg-muted/30">
            <div className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    <div className="col-span-2 md:col-span-1">
                        <Link href={homeHref} className="mb-4 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-900">
                                <span className="text-sm font-bold text-white">EP</span>
                            </div>
                            <span className="text-xl font-bold">Easy Prospect</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            {t("about")}
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">{t("productTitle")}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/catalog" className="hover:text-foreground">{t("catalog")}</Link></li>
                            <li><Link href={howItWorksHref} className="hover:text-foreground">{t("howItWorks")}</Link></li>
                            <li><Link href={faqHref} className="hover:text-foreground">{t("faq")}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">{t("accountTitle")}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/my-purchases" className="hover:text-foreground">{t("myPurchases")}</Link></li>
                            <li><Link href="/sign-in" className="hover:text-foreground">{t("login")}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">{t("legalTitle")}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/terms" className="hover:text-foreground">{t("terms")}</Link></li>
                            <li><Link href="/privacy" className="hover:text-foreground">{t("privacy")}</Link></li>
                            <li><Link href={faqHref} className="hover:text-foreground">{t("contact")}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
                    <p>{t("copyright", { year: new Date().getFullYear() })}</p>
                </div>
            </div>
        </footer>
    )
}
