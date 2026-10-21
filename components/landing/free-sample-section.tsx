// components/landing/free-sample-section.tsx
// eslint-disable-next-line no-restricted-imports -- usado só para /sign-up, fora do segmento de locale
import NextLink from "next/link"
import { getTranslations } from "next-intl/server"
import { FileText } from "lucide-react"
import { Section, SectionHeading } from "./section"
import { StudyViewer } from "./study-viewer"
import { getAmostraAtiva } from "@/lib/free-sample/amostra-ativa"
import type { LandingLocale } from "./types"

/** Âncora da seção, usada pelo destaque do hero. Mesmo padrão do #ablauf. */
export function freeSampleAnchor(locale: LandingLocale): string {
    return locale === "de" ? "kostenlose-studie" : "estudo-gratuito"
}

/**
 * Só existe quando há amostra ativa no super-admin.
 *
 * Mesma regra do `visibleFacets` do catálogo: seção sem arquivo por trás é
 * promessa que a página não cumpre. Sem `FreeSample` ativo isto devolve `null`
 * e a home fica idêntica ao que era antes da feature — é assim que ela pode
 * ficar publicada e invisível até o arquivo existir.
 */
export async function FreeSampleSection({ locale }: { locale: LandingLocale }) {
    const amostra = await getAmostraAtiva()
    if (!amostra) return null

    const t = await getTranslations({ locale, namespace: "landing.freeSample" })
    const tConta = await getTranslations({ locale, namespace: "freeStudy" })

    return (
        // Logo abaixo do hero, que é `default` e chama para cá: o fundo muted
        // separa a seção dele e da introdução, que vem em seguida.
        <Section id={freeSampleAnchor(locale)} tone="muted" width="narrow">
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />

            <div className="mt-6">
                <p className="mb-4 flex items-center gap-2.5 text-sm font-medium text-foreground">
                    <FileText className="h-5 w-5 text-brand-accent-strong" />
                    {t("fileNote")}
                </p>
                <StudyViewer fileName={amostra.fileName} />
            </div>

            {/* A leitura é aberta; a conta é para quem quer o estudo guardado
                junto das compras. Os dois entregam o mesmo arquivo. */}
            <p className="mt-4 text-center text-sm text-muted-foreground">
                {tConta("homeSignUpText")}{" "}
                <NextLink
                    href={`/sign-up?lang=${locale}`}
                    className="font-medium text-brand-accent-strong underline underline-offset-4 hover:no-underline"
                >
                    {tConta("homeSignUpCta")}
                </NextLink>
            </p>
        </Section>
    )
}
