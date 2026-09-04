import { getTranslations } from "next-intl/server"
import { Link } from "@/lib/i18n/navigation"
import { excecoesDoIdioma, nomeDePais } from "@/lib/i18n/nome-de-pais"
import { getMercadosDoCatalogo } from "@/lib/marketplace/mercados-catalogo"
import { Section, SectionHeading } from "./section"
import { WorldMap, type PaisCoberto } from "./world-map"
import type { LandingLocale } from "./types"

/**
 * Onde o catálogo chega, num mapa-múndi com os países cobertos destacados.
 *
 * A seção lia uma lista de cinco regiões linguísticas cravada em `messages/`
 * ("países de língua alemã", "países escandinavos"). Aquela lista era do começo
 * do projeto e nunca acompanhou o catálogo: quando saiu, o catálogo já cobria 62
 * países em seis continentes. Agora tudo vem de `getMercadosDoCatalogo()` — o
 * mesmo caminho que as facetas de país tomaram em 03/09, e pelo mesmo motivo.
 *
 * O número de continentes NÃO está escrito em lugar nenhum: a frase é montada
 * com `continentesCobertos`, contado no banco. Se o catálogo perder o único
 * estudo da Oceania, a frase encolhe sozinha em vez de virar mentira.
 *
 * Continente sem estudo aparece assim mesmo, apagado e sem link. Some-lo daria
 * a impressão de que o mundo tem só os continentes que vendemos, e o contraste
 * entre coberto e não coberto é justamente o que faz a cobertura significar
 * alguma coisa.
 */
export async function TargetMarketsSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.zielmaerkte" })
    const mercados = await getMercadosDoCatalogo()

    if (mercados.totalPaises === 0) {
        return null
    }

    const excecoes = excecoesDoIdioma(locale)
    const cobertos: PaisCoberto[] = mercados.paises.map((pais) => ({
        code: pais.code,
        nome: nomeDePais(pais.code, locale, excecoes),
        estudos: pais.estudos,
    }))

    return (
        <Section tone="muted">
            <SectionHeading
                eyebrow={t("eyebrow")}
                title={t("title")}
                intro={t("intro", {
                    paises: mercados.totalPaises,
                    continentes: mercados.continentesCobertos,
                })}
            />

            <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-center">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-vitrine md:p-6">
                    <WorldMap cobertos={cobertos} locale={locale} />
                </div>

                <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    {mercados.continentes.map((continente) => {
                        const nome = t(`continents.${continente.continente}`)
                        const vazio = continente.paises === 0

                        const conteudo = (
                            <>
                                <dt
                                    className={
                                        vazio
                                            ? "text-sm font-semibold text-muted-foreground"
                                            : "text-sm font-semibold text-foreground"
                                    }
                                >
                                    {nome}
                                </dt>
                                <dd className="text-sm tabular-nums text-muted-foreground">
                                    {vazio
                                        ? t("emptyContinent")
                                        : t("continentCount", { paises: continente.paises })}
                                </dd>
                            </>
                        )

                        if (vazio) {
                            return (
                                <div
                                    key={continente.continente}
                                    className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-border px-4 py-3 opacity-60"
                                >
                                    {conteudo}
                                </div>
                            )
                        }

                        return (
                            <Link
                                key={continente.continente}
                                // Filtra pelos países REALMENTE cobertos daquele
                                // continente, e não por todos os que ele tem: o
                                // catálogo é a fonte, então o link nunca aponta
                                // para um filtro que não devolve nada.
                                href={`/catalog?countries=${continente.codigos.join(",")}`}
                                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                            >
                                {conteudo}
                            </Link>
                        )
                    })}
                </dl>
            </div>

            <p className="mx-auto mt-10 max-w-3xl rounded-r-lg border border-l-[3px] border-border border-l-brand-accent-strong bg-background px-5 py-4 text-sm leading-6 text-muted-foreground">
                {t("note")}
            </p>
        </Section>
    )
}
