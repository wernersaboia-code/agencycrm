import { ArrowRight, BadgeCheck, CheckCircle2, ShieldCheck } from "lucide-react"
import { after } from "next/server"
import { getTranslations } from "next-intl/server"
import { getAmostraAtiva } from "@/lib/free-sample/amostra-ativa"
import { garantirPaginas, getPaginasDaAmostra } from "@/lib/free-sample/paginas"
import { HeroStudyPreview } from "./hero-study-preview"
import { StudyViewer } from "./study-viewer"
import { Link } from "@/lib/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { LandingLocale } from "./types"

/** Âncora da amostra gratuita, que mora no hero. Mesmo padrão do #ablauf. */
export function freeSampleAnchor(locale: LandingLocale): string {
    return locale === "de" ? "kostenlose-studie" : "estudo-gratuito"
}

export async function HeroSection({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.hero" })
    const tAmostra = await getTranslations({ locale, namespace: "landing.freeSample" })
    const tEntrega = await getTranslations({ locale, namespace: "landing.lieferumfang" })
    const tConta = await getTranslations({ locale, namespace: "freeStudy" })
    // Mesma regra da seção: sem amostra ativa no super-admin, sem destaque.
    const amostra = await getAmostraAtiva()
    const paginas = amostra ? await getPaginasDaAmostra(amostra.id) : []
    // Amostra sem páginas (subiu antes do folhear, ou o desenho falhou): gera
    // depois de responder, e a próxima visita já encontra as imagens. Antes
    // isso só acontecia ao subir ou ligar no admin, e a amostra que já estava
    // no ar ficou parada.
    // Só no servidor publicado: o `next dev` aponta para o mesmo storage, e
    // abrir a home localmente não deve escrever nele.
    if (amostra && paginas.length === 0 && process.env.NODE_ENV === "production") {
        after(() => garantirPaginas(amostra.id, amostra.filePath))
    }

    return (
        <section className="relative isolate">
            {/* O degradê fica numa camada própria para poder sumir aos poucos
                na base, em vez de terminar numa borda contra a seção seguinte. */}
            <div
                aria-hidden
                className="hero-gradient absolute inset-0 -z-10 mask-[linear-gradient(to_bottom,#000_60%,transparent)]"
            />
            <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24">
                {/* A frase ocupa o topo inteiro, centralizada; o estudo vem logo
                    abaixo, como prova do que a frase promete. */}
                <div className="mx-auto max-w-3xl text-center">
                    <Badge className="mb-5 rounded-md border-brand-accent/40 bg-brand-accent/15 px-3 py-1 text-brand-accent-strong hover:bg-brand-accent/15">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {t("badge")}
                    </Badge>

                    <h1 className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
                        {t("title")}
                    </h1>

                    <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                        {t("subtitle")}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Button size="lg" className="bg-brand text-brand-foreground hover:bg-brand-hover" asChild>
                            <Link href="/catalog">
                                {t("ctaPrimary")}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link href={locale === "de" ? "#ablauf" : "#como-funciona"}>{t("ctaSecondary")}</Link>
                        </Button>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                        <TrustNote icon={CheckCircle2} text={t("trust1")} />
                        <TrustNote icon={ShieldCheck} text={t("trust2")} />
                        <TrustNote icon={BadgeCheck} text={t("trust3")} />
                    </div>
                </div>

                {/* Com amostra ativa, o próprio estudo, com as páginas passando.
                    Sem ela, a prévia dos tópicos leva ao catálogo: "ler estudo
                    grátis" seria promessa sem arquivo. */}
                <div className="mt-14 md:mt-16">
                    {amostra ? (
                        <StudyViewer
                            id={freeSampleAnchor(locale)}
                            pages={paginas}
                            signUpText={tConta("homeSignUpText")}
                            signUpCta={tConta("homeSignUpCta")}
                            signUpHref={`/sign-up?lang=${locale}`}
                        />
                    ) : (
                        <HeroStudyPreview
                            eyebrow="PDF"
                            title={tAmostra("viewerFileLabel")}
                            contentsLabel={t("previewContents")}
                            items={(tEntrega.raw("items") as string[]).slice(0, 4)}
                            cta={t("ctaPrimary")}
                            href="/catalog"
                        />
                    )}
                </div>
            </div>
        </section>
    )
}

function TrustNote({
    icon: Icon,
    text,
}: {
    icon: React.ComponentType<{ className?: string }>
    text: string
}) {
    return (
        <span className="inline-flex items-center gap-2">
            <Icon className="h-4 w-4 text-brand-accent-strong" />
            {text}
        </span>
    )
}
