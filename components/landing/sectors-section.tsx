import { ArrowRight, Boxes, Citrus, Cookie, ShoppingBasket, ToyBrick, UtensilsCrossed } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/lib/i18n/navigation"
import { getMercadosDoCatalogo } from "@/lib/marketplace/mercados-catalogo"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

/**
 * Os setores para os quais já existem estudos, lidos do catálogo.
 *
 * Substituiu "Perfis de compra", que separava os importadores em "foco na UE",
 * "orientados ao Mercosul" e afins. Aquilo tinha dois problemas, e o segundo é
 * o que decidiu:
 *
 * 1. Contradizia o mapa. A seção de mercados afirma cobertura em seis
 *    continentes, e três seções abaixo a página oferecia UE e Mercosul como os
 *    tipos de comprador.
 * 2. O catálogo não sustenta esse recorte. A faceta "categoria"
 *    (importadores/exportadores/fabricantes) já tinha sido REMOVIDA por isso —
 *    ver `lib/constants/catalog-facets.ts`: "uma mesma lista de país mistura
 *    importadores, distribuidores e atacadistas no mesmo arquivo, então nenhum
 *    valor único descrevia a lista com honestidade".
 *
 * Setor é a outra metade da busca do catálogo — país e setor, e só —, e a home
 * respondia "país" com o mapa sem dizer nada sobre setor além de um número na
 * faixa de estatísticas.
 *
 * A lista se atualiza sozinha: `getMercadosDoCatalogo()` devolve os setores com
 * pelo menos um estudo, então publicar estudo de setor novo faz o card aparecer
 * sem tocar em código. O que continua exigindo commit é o vocabulário — setor
 * novo precisa entrar em `INDUSTRY_IDS` e ter rótulo nos sete idiomas —, e isso
 * é de propósito: "HoReCa" e "FMCG" são linguagem do negócio, que nenhum runtime
 * conhece.
 *
 * A contagem por setor existe no dado e NÃO é exibida: hoje 62 dos 77 estudos
 * são HoReCa, e a seção é uma porta de entrada para o catálogo, não um relatório
 * de composição. Quem quiser o número tem o filtro a um clique.
 */

/**
 * Ícone por setor. Setor fora deste mapa cai no genérico em vez de quebrar — é
 * o que permite publicar um setor novo sem que a home dependa deste commit.
 */
const ICONE_POR_SETOR: Record<string, React.ComponentType<{ className?: string }>> = {
    horeca: UtensilsCrossed,
    fmcg: ShoppingBasket,
    exotic_fruits: Citrus,
    snacks_bars: Cookie,
    toys: ToyBrick,
}

export async function SectorsSection({ locale }: { locale: LandingLocale }) {
    const { setores } = await getMercadosDoCatalogo()

    if (setores.length === 0) {
        return null
    }

    const t = await getTranslations({ locale, namespace: "landing.setores" })
    const tCatalog = await getTranslations({ locale, namespace: "catalog" })

    return (
        <Section>
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />

            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {setores.map((setor) => {
                    const Icone = ICONE_POR_SETOR[setor.id] ?? Boxes

                    return (
                        <li key={setor.id}>
                            <Link
                                href={`/catalog?industries=${setor.id}`}
                                className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-vitrine transition-colors hover:border-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent-strong">
                                    <Icone className="h-5 w-5" />
                                </span>
                                <span className="font-semibold text-foreground group-hover:text-brand-accent-strong">
                                    {tCatalog(`industries.${setor.id}`)}
                                </span>
                                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-accent-strong" />
                            </Link>
                        </li>
                    )
                })}
            </ul>

            <p className="mt-8 leading-7 text-muted-foreground">{t("close")}</p>
        </Section>
    )
}
