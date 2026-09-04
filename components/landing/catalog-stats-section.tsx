import { getTranslations } from "next-intl/server"
import { getResumoCatalogo } from "@/lib/marketplace/resumo-catalogo"
import type { LandingLocale } from "./types"

/**
 * O tamanho real do catálogo, em quatro números, na faixa logo abaixo do hero.
 *
 * Ocupa o lugar que a referência (duna.com) dá a "10.6x mais rápido", "37% mais
 * conversão". Aqueles são números de RESULTADO — promessa de efeito no negócio do
 * cliente, que este projeto não faz. Estes são números de INVENTÁRIO: contáveis,
 * verificáveis, e verdadeiros por construção porque saem do banco.
 *
 * Linha limpa em vez de card-grid: quatro números grandes com divisores finos,
 * o formato que a duna usa. O título da seção saiu — abaixo do hero, repetir o
 * posicionamento na faixa de números é redundância; a copy fica no corpo.
 *
 * Sem estudo ativo a seção devolve `null`, mesmo critério de `FreeSampleSection`
 * e de `visibleFacets` no catálogo: bloco sem lastro é promessa que a página não
 * cumpre.
 */
export async function CatalogStatsSection({ locale }: { locale: LandingLocale }) {
    const resumo = await getResumoCatalogo()
    if (resumo.estudos === 0) {
        return null
    }

    const t = await getTranslations({ locale, namespace: "landing.stats" })

    const numeros = [
        { valor: String(resumo.estudos), rotulo: t("studies") },
        { valor: String(resumo.paises), rotulo: t("countries") },
        { valor: String(resumo.setores), rotulo: t("sectors") },
    ]

    if (resumo.revisadoEm) {
        numeros.push({
            // `revisadoEm` chega como string ISO 8601, não como `Date`:
            // `getResumoCatalogo` roda dentro de `unstable_cache`, que serializa
            // o retorno para JSON no Data Cache. Precisa do `new Date(...)` aqui —
            // não "simplificar" removendo o parse.
            valor: new Intl.DateTimeFormat(locale, {
                month: "short",
                year: "numeric",
            }).format(new Date(resumo.revisadoEm)),
            rotulo: t("reviewed"),
        })
    }

    return (
        <section className="border-b border-border bg-background">
            <div className="container mx-auto px-4 py-12 md:py-16">
                <p className="text-center text-sm font-semibold uppercase tracking-wider text-brand-accent-strong">
                    {t("eyebrow")}
                </p>

                <dl className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-y-10 md:grid-cols-4 md:divide-x md:divide-border">
                    {numeros.map((numero) => (
                        // `flex-col-reverse` preserva a semântica (<dt> termo antes
                        // do <dd> descrição) com o número em cima e o rótulo abaixo.
                        <div
                            key={numero.rotulo}
                            className="flex flex-col-reverse items-center gap-3 px-4 text-center"
                        >
                            <dt className="text-sm text-muted-foreground">{numero.rotulo}</dt>
                            <dd className="text-4xl font-bold tabular-nums tracking-tight text-foreground md:text-5xl">
                                {numero.valor}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    )
}
