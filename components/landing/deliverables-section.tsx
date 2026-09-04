import { CheckCircle2, FileText } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

/**
 * O que vem dentro do estudo, em texto: o relatório de mercado e os sete temas
 * práticos que ele cobre.
 *
 * A seção tinha saído da home junto com a grade estática de quatro imagens que
 * vivia no fim dela. As imagens de fato eram redundantes — o `ShowcaseSection`
 * mostra as mesmas páginas melhor —, mas a lista de temas não tinha cópia em
 * lugar nenhum e sumiu junto. É a única parte da página que diz, item a item, o
 * que o comprador leva; sem ela a home descreve o formato do estudo e nunca o
 * conteúdo.
 *
 * Voltou em duas colunas em vez do bloco `narrow` de antes: o showcase logo
 * acima já é um bloco largo com imagem, e repetir a coluna estreita de texto
 * aqui faria as duas seções brigarem pelo mesmo ritmo.
 */
export async function DeliverablesSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.lieferumfang" })
    const items = t.raw("items") as string[]

    return (
        <Section>
            {/* Visual à ESQUERDA aqui, ao contrário do showcase logo acima, que
                tem a lista à esquerda e a pilha de páginas à direita. A home
                inteira pendia para o mesmo lado — texto à esquerda, painel à
                direita, seção após seção —, e alternar o lado do visual é o que
                dá o zigue-zague da referência. A ordem do DOM não muda: o título
                continua vindo primeiro para quem lê por leitor de tela ou no
                celular, e só o `order` do grid inverte no `lg`. */}
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
                <div className="lg:order-2">
                    <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

                    <div className="mt-7 rounded-2xl border border-brand-accent/40 bg-brand-accent/10 p-6">
                        <h3 className="flex items-center gap-2.5 font-semibold text-foreground">
                            <FileText className="h-5 w-5 text-brand-accent-strong" />
                            {t("reportTitle")}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {t("reportBody")}
                        </p>
                    </div>

                    <p className="mt-6 leading-7 text-muted-foreground">{t("close")}</p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-7 shadow-vitrine lg:order-1">
                    <p className="leading-7 text-muted-foreground">{t("listIntro")}</p>

                    <ul className="mt-5 space-y-3">
                        {items.map((item) => (
                            <li
                                key={item}
                                className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
                            >
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent-strong" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Section>
    )
}
