import { CheckCircle2 } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Section, SectionHeading } from "./section"
import { StudyFlowDiagram } from "./study-flow-diagram"
import type { LandingLocale } from "./types"

/**
 * O centro da página: como um estudo é feito, o checklist de verificação e os
 * limites declarados.
 *
 * Os dois textos são transcrição do documento do sócio e já viviam em
 * `content/about/about.<locale>.ts`. Aqui eles aparecem DE NOVO, em
 * `messages/`, e a duplicação é deliberada: `content/about` é transcrição
 * literal que não se reescreve, e a home precisa da versão curta. Não unificar
 * — mexer numa quebra a outra.
 *
 * O bloco de limites ocupa, de propósito, o lugar onde a referência (duna.com)
 * põe um depoimento com nome e foto de cliente. Declarar o que não se promete,
 * onde o concorrente põe elogio, é a troca mais barata desta página.
 *
 * `tone="deep"`: esta é a ÚNICA quebra tonal da home, e ela está aqui porque é
 * aqui que a página mostra mecanismo em vez de afirmar qualidade — o mesmo
 * papel do bloco escuro da referência. Duas quebras não são quebra, são
 * listras: antes de dar `deep` a outra seção, tirar desta.
 */
export async function MethodSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.method" })
    const checks = t.raw("checks") as string[]
    const fontes = t.raw("flow.sources") as string[]
    const tNav = await getTranslations({ locale, namespace: "nav" })

    return (
        <Section tone="deep" size="lead">
            <SectionHeading
                eyebrow={t("eyebrow")}
                title={t("checksTitle")}
                centered
                action={{ href: "/about", label: tNav("about") }}
            />

            <div className="mt-14">
                <StudyFlowDiagram
                    step1={t("flow.step1")}
                    step2={t("flow.step2")}
                    step3={t("flow.step3")}
                    sources={fontes}
                    loop={t("flow.loop")}
                    alt={t("flow.alt")}
                />
                <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
                    {t("flow.note")}
                </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2">
                <ul className="space-y-3 rounded-2xl border border-border bg-card p-6">
                    {checks.map((check) => (
                        <li
                            key={check}
                            className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
                        >
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent-strong" />
                            {check}
                        </li>
                    ))}
                </ul>

                <div className="rounded-2xl border border-border bg-muted p-6">
                    <h3 className="font-semibold text-foreground">{t("limitsTitle")}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("limitsBody")}</p>
                </div>
            </div>
        </Section>
    )
}
