import { CheckCircle2 } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Section, SectionHeading } from "./section"
import type { LandingLocale } from "./types"

/**
 * O checklist de verificação e os limites declarados, lado a lado.
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
 * `tone="muted"`: esta seção entra entre `DataQualitySection` e
 * `AdvantageSection`, um trecho que já roda quatro seções `default` seguidas.
 * Uma quinta anularia o ritmo que a Task 1 deu à página; o `muted` corta a
 * sequência.
 */
export async function MethodSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.method" })
    const checks = t.raw("checks") as string[]

    return (
        <Section tone="muted" size="lead">
            <SectionHeading eyebrow={t("eyebrow")} title={t("checksTitle")} centered />

            <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
                <ul className="space-y-3 rounded-lg border border-border bg-card p-6">
                    {checks.map((check) => (
                        <li key={check} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent-strong" />
                            {check}
                        </li>
                    ))}
                </ul>

                <div className="rounded-lg border border-border bg-muted/40 p-6">
                    <h3 className="font-semibold text-foreground">{t("limitsTitle")}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("limitsBody")}</p>
                </div>
            </div>
        </Section>
    )
}
