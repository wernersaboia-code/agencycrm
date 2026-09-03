import { getTranslations } from "next-intl/server"
import { getResumoCatalogo } from "@/lib/marketplace/resumo-catalogo"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

/**
 * O tamanho real do catálogo, em quatro números.
 *
 * Substitui o que a referência (duna.com) põe neste lugar: "10.6x mais rápido",
 * "37% mais conversão". Aqueles são números de RESULTADO — promessa de efeito no
 * negócio do cliente, que este projeto não faz. Estes são números de INVENTÁRIO:
 * contáveis, verificáveis, e verdadeiros por construção porque saem do banco.
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
        <Section tone="muted">
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} centered />

            <dl className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
                {numeros.map((numero) => (
                    <div key={numero.rotulo} className="bg-card p-6 text-center">
                        <dt className="sr-only">{numero.rotulo}</dt>
                        <dd>
                            <span className="block text-3xl font-bold tabular-nums text-brand-accent-strong md:text-4xl">
                                {numero.valor}
                            </span>
                            <span className="mt-2 block text-sm text-muted-foreground">
                                {numero.rotulo}
                            </span>
                        </dd>
                    </div>
                ))}
            </dl>
        </Section>
    )
}
