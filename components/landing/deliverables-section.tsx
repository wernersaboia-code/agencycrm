import { CheckCircle2, FileText } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { getAmostraAtiva } from "@/lib/free-sample/amostra-ativa"
import { escolherFolhas } from "@/lib/free-sample/folhas"
import { getPaginasDaAmostra } from "@/lib/free-sample/paginas"
import { cn } from "@/lib/utils"
import { freeSampleAnchor } from "./hero-section"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

/** Leque: a folha do meio por cima, as duas de trás abertas para os lados. */
const POSICAO_DA_FOLHA = [
    "left-0 top-[9%] -rotate-6",
    "left-[21%] top-0 z-10",
    "right-0 top-[9%] rotate-6",
]

export async function DeliverablesSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.lieferumfang" })
    const tAmostra = await getTranslations({ locale, namespace: "landing.freeSample" })
    const items = t.raw("items") as string[]
    const amostra = await getAmostraAtiva()
    const folhas = escolherFolhas(amostra ? await getPaginasDaAmostra(amostra.id) : [])
    const comFolhas = folhas.length > 0

    const texto = (
        <div>
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

            <div className="mt-6 rounded-lg border border-brand-accent/40 bg-brand-accent/10 p-6">
                <h3 className="flex items-center gap-2.5 font-semibold text-foreground">
                    <FileText className="h-5 w-5 text-brand-accent-strong" />
                    {t("reportTitle")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("reportBody")}</p>
            </div>

            <p className="mt-6 leading-7 text-muted-foreground">{t("listIntro")}</p>

            <ul className="mt-4 space-y-3">
                {items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent-strong" />
                        {item}
                    </li>
                ))}
            </ul>

            <p className="mt-6 leading-7 text-muted-foreground">{t("close")}</p>
        </div>
    )

    // Sem amostra ativa (ou com páginas ainda não geradas) a seção é a de
    // sempre: coluna estreita, só texto.
    if (!comFolhas) {
        return (
            <Section tone="glow" width="narrow">
                {texto}
            </Section>
        )
    }

    return (
        <Section tone="glow">
            {/* A seção dizia o que o estudo traz sem mostrar nenhuma página
                dele. As folhas são da amostra gratuita — o mesmo arquivo que o
                hero folheia — e levam até ela. Só a partir de `lg`: no celular
                a home já é longa, e o folhear do topo cumpre esse papel. */}
            <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
                {texto}

                <a
                    href={`#${freeSampleAnchor(locale)}`}
                    aria-label={tAmostra("viewerCta")}
                    className="group relative hidden aspect-[1/0.98] w-full lg:block"
                >
                    {folhas.map((src, i) => (
                        <span
                            key={src}
                            className={cn(
                                "absolute block aspect-[1/1.414] w-[58%] overflow-hidden rounded-md border border-border bg-white shadow-lg shadow-black/30 transition-transform duration-300 group-hover:-translate-y-1",
                                POSICAO_DA_FOLHA[i]
                            )}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element -- mesma origem e mesmo motivo do StudyViewer: WebP já no tamanho certo, num bucket público */}
                            <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" />
                        </span>
                    ))}
                </a>
            </div>
        </Section>
    )
}
