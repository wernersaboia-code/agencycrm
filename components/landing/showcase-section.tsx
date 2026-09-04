import { getTranslations } from "next-intl/server"
import { Section, SectionHeading } from "./section"
import { Showcase, type ShowcaseArea } from "./showcase"
import type { LandingLocale } from "./types"

type AreaT = { eyebrow: string; title: string; description: string }

// As quatro páginas reais de um estudo do catálogo, na ordem que o "onboarding"
// da duna mostraria: panorama → estrutura → análise → perfis. Cada uma é uma aba
// e uma mini-página empilhada; a legenda (alt) reusa a tradução da amostra.
const PAGINAS = [
    { arquivo: "capa", capKey: "cover" },
    { arquivo: "indice", capKey: "contents" },
    { arquivo: "dados", capKey: "data" },
    { arquivo: "diretorio", capKey: "directory" },
] as const

export async function ShowcaseSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.showcase" })
    const tSample = await getTranslations({ locale, namespace: "landing.lieferumfang.sample" })
    const tLinks = await getTranslations({ locale, namespace: "landing.sectionLinks" })
    const areas = t.raw("areas") as AreaT[]

    const showcaseAreas: ShowcaseArea[] = PAGINAS.map((pagina, index) => {
        const area = areas[index] ?? areas[0]
        return {
            key: pagina.arquivo,
            eyebrow: area.eyebrow,
            title: area.title,
            description: area.description,
            src: `/estudo-exemplo/${pagina.arquivo}.webp`,
            alt: tSample(`captions.${pagina.capKey}`),
            href: `/estudo-exemplo/${pagina.arquivo}.webp`,
        }
    })

    return (
        <Section tone="muted">
            <SectionHeading
                eyebrow={t("eyebrow")}
                title={t("title")}
                intro={t("intro")}
                action={{ href: "/catalog", label: tLinks("catalog") }}
            />
            <div className="mt-12">
                {/* A nota da amostra vem junto: ela diz que os contatos do
                    diretório aparecem borrados e que o estudo é redigido em
                    inglês. As duas coisas eram ditas só aqui na página inteira —
                    o visitante descobrir sozinho depois de pagar é pior. */}
                <Showcase
                    areas={showcaseAreas}
                    note={tSample("note")}
                    viewFullLabel={t("viewFull")}
                />
            </div>
        </Section>
    )
}
