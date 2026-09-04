// eslint-disable-next-line no-restricted-imports -- único uso restante é /sign-in, fora do segmento de locale
import Link from "next/link"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Link as LocaleLink } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/locales"
import { getMercadosDoCatalogo } from "@/lib/marketplace/mercados-catalogo"

// As colunas "Setores" e "Mercados" saem ambas de `getMercadosDoCatalogo()`,
// a mesma fonte das seções correspondentes da home. Uma consulta e uma entrada
// de cache servem o rodapé inteiro, que aparece em toda página pública.
//
// "Mercados" listava cinco regiões linguísticas cravadas em `messages/`
// ("países de língua alemã", "escandinavos"). Eram do começo do projeto e já
// não descreviam um catálogo com 62 países em seis continentes. Cada link
// filtra pelos países REALMENTE cobertos do continente — nunca por todos os que
// ele tem, o que encheria o catálogo de facetas selecionadas e zeradas.
//
// "Setores" percorria `INDUSTRY_IDS` inteiro, isto é, o VOCABULÁRIO e não o
// catálogo. Enquanto todo id tivesse estudo dava no mesmo, mas o vocabulário
// existe para ser maior que a operação: um setor cadastrado antes do estudo
// ficar pronto virava link para um filtro vazio no rodapé de todas as páginas —
// exatamente a "promessa de catálogo que não existe" que `catalog-facets.ts`
// evita no filtro público e a home evita na seção de setores.

export async function MarketplaceFooter({ locale = "pt" }: { locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: "footer" })
    // Rótulos de setor e de região já traduzidos nos sete idiomas — reaproveitados
    // daqui em vez de duplicados no bloco `footer`.
    const tCatalog = await getTranslations({ locale, namespace: "catalog" })
    const tMarkets = await getTranslations({ locale, namespace: "landing.zielmaerkte" })
    const mercados = await getMercadosDoCatalogo()
    const continentesComEstudo = mercados.continentes.filter((c) => c.paises > 0)

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

                    {/* Coluna some inteira quando não há o que listar, título
                        junto: com a lista vindo do catálogo, um cabeçalho
                        "Setores" sobre o vazio seria pior que coluna nenhuma.
                        Mesmo critério das seções da home que devolvem `null`. */}
                    {mercados.setores.length > 0 && (
                        <div>
                            <h4 className="mb-4 font-semibold">{t("sectorsTitle")}</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {mercados.setores.map((setor) => (
                                    <li key={setor.id}>
                                        <LocaleLink
                                            href={`/catalog?industries=${setor.id}`}
                                            className="hover:text-foreground"
                                        >
                                            {tCatalog(`industries.${setor.id}`)}
                                        </LocaleLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {continentesComEstudo.length > 0 && (
                        <div>
                            <h4 className="mb-4 font-semibold">{t("marketsTitle")}</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {continentesComEstudo.map((continente) => (
                                    <li key={continente.continente}>
                                        <LocaleLink
                                            href={`/catalog?countries=${continente.codigos.join(",")}`}
                                            className="hover:text-foreground"
                                        >
                                            {tMarkets(`continents.${continente.continente}`)}
                                        </LocaleLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
                    <p>{t("copyright", { year: new Date().getFullYear() })}</p>
                </div>
            </div>
        </footer>
    )
}
