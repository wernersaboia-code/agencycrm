// eslint-disable-next-line no-restricted-imports -- único uso restante é /sign-in, fora do segmento de locale
import Link from "next/link"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Link as LocaleLink } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/locales"
import { INDUSTRY_IDS, COUNTRY_CODES } from "@/lib/constants/catalog-facets"

// A faceta de mercado do landing mostra os países como texto ("DE · AT · CH"),
// às vezes com reticências e com códigos que ainda não estão no vocabulário
// (MX, CL, IS…). Para o link do filtro só interessam os códigos que o catálogo
// reconhece, então cruzamos com COUNTRY_CODES: país que entrar no vocabulário
// passa a filtrar sozinho, e país que sair não gera parâmetro morto.
type LandingRegion = { flag: string; title: string; countries: string }

const CATALOG_COUNTRY_CODES = new Set<string>(COUNTRY_CODES)

function regionCountryParam(countries: string): string {
    return countries
        .split(/[^A-Za-z]+/)
        .map((token) => token.toUpperCase())
        .filter((token) => CATALOG_COUNTRY_CODES.has(token))
        .join(",")
}

export async function MarketplaceFooter({ locale = "pt" }: { locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: "footer" })
    // Rótulos de setor e de região já traduzidos nos sete idiomas — reaproveitados
    // daqui em vez de duplicados no bloco `footer`.
    const tCatalog = await getTranslations({ locale, namespace: "catalog" })
    const tMarkets = await getTranslations({ locale, namespace: "landing.zielmaerkte" })
    const regions = tMarkets.raw("regions") as LandingRegion[]

    // O id da âncora ainda não tem tradução para todos os locales; a rota em
    // si (que carrega o prefixo de idioma) vem do wrapper de navegação.
    const howItWorksAnchor = locale === "de" ? "ablauf" : "como-funciona"
    const howItWorksHref = `/#${howItWorksAnchor}`

    return (
        <footer className="border-t bg-muted/30">
            <div className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    <div className="col-span-2 md:col-span-1">
                        <LocaleLink href="/" className="mb-4 flex items-center gap-2">
                            <Image src="/logo-icon.png" alt="Easy Prospect" width={32} height={32} className="h-8 w-8" />
                            <span className="text-xl font-bold">Easy Prospect</span>
                        </LocaleLink>
                        <p className="text-sm text-muted-foreground">
                            {t("about")}
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">{t("productTitle")}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><LocaleLink href="/catalog" className="hover:text-foreground">{t("catalog")}</LocaleLink></li>
                            <li><LocaleLink href={howItWorksHref} className="hover:text-foreground">{t("howItWorks")}</LocaleLink></li>
                            <li><LocaleLink href="/blog" className="hover:text-foreground">{t("blog")}</LocaleLink></li>
                            <li><LocaleLink href="/faq" className="hover:text-foreground">{t("faq")}</LocaleLink></li>
                            <li><LocaleLink href="/about" className="hover:text-foreground">{t("aboutUs")}</LocaleLink></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">{t("accountTitle")}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {/* "Minhas compras" fica só no menu do header (visível
                                depois do login). Aqui, num rodapé servido em toda
                                página pública, o link era um /my-purchases fixo que
                                o Googlebot seguia e batia no 307 para /sign-in —
                                sete URLs de "Página com redirecionamento" no GSC
                                (contando a variante /de/). Quem está deslogado não
                                tem o que ver nessa página de qualquer forma. */}
                            <li><Link href={`/sign-in?lang=${locale}`} className="hover:text-foreground">{t("login")}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">{t("legalTitle")}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><LocaleLink href="/terms" className="hover:text-foreground">{t("terms")}</LocaleLink></li>
                            <li><LocaleLink href="/privacy" className="hover:text-foreground">{t("privacy")}</LocaleLink></li>
                            <li><LocaleLink href="/refund" className="hover:text-foreground">{t("refund")}</LocaleLink></li>
                            <li><LocaleLink href="/faq" className="hover:text-foreground">{t("contact")}</LocaleLink></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">{t("sectorsTitle")}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {/* Lista derivada de INDUSTRY_IDS, não escrita à mão: setor
                                novo no vocabulário aparece aqui sozinho e setor removido
                                não deixa link morto para uma faceta que o filtro não
                                conhece mais. */}
                            {INDUSTRY_IDS.map((id) => (
                                <li key={id}>
                                    <LocaleLink href={`/catalog?industries=${id}`} className="hover:text-foreground">
                                        {tCatalog(`industries.${id}`)}
                                    </LocaleLink>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">{t("marketsTitle")}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {regions.map((region) => (
                                <li key={region.flag}>
                                    <LocaleLink
                                        href={`/catalog?countries=${regionCountryParam(region.countries)}`}
                                        className="hover:text-foreground"
                                    >
                                        {region.title}
                                    </LocaleLink>
                                </li>
                            ))}
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
