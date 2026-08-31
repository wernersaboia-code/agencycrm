import Image from "next/image"
import { getTranslations } from "next-intl/server"
import type { LandingLocale } from "./types"

/**
 * Quatro páginas reais de um estudo do catálogo, para o visitante ver o que
 * compra antes de comprar.
 *
 * As imagens são geradas por `scripts/gerar-imagens-estudo.py`, e duas regras
 * dele valem aqui também, porque trocar um arquivo em `public/estudo-exemplo/`
 * à mão contorna o script sem contornar as consequências:
 *
 * 1. A origem é sempre o PDF JÁ REDIGIDO. A 150 dpi, e-mail é perfeitamente
 *    legível — imagem tirada do original vazaria na vitrine o contato que foi
 *    removido do arquivo.
 * 2. A página do diretório entra com a coluna de contato borrada. Publicá-la
 *    legível entrega de graça o que se vende e devolve ao site a leitura de
 *    lista de prospecção, que é o enquadramento que já custou um provedor de
 *    pagamento. Mostrar a ESTRUTURA da entrada é o objetivo; mostrar os
 *    contatos, não.
 *
 * O `nota` diz na cara que os contatos estão borrados e que o estudo é em
 * inglês. Nenhuma das duas coisas era dita em lugar nenhum do site, e a imagem
 * torna as duas visíveis de qualquer forma — o visitante descobrir sozinho
 * depois de pagar é pior.
 */
const PAGINAS = [
    { arquivo: "capa", chave: "cover" },
    { arquivo: "indice", chave: "contents" },
    { arquivo: "dados", chave: "data" },
    { arquivo: "diretorio", chave: "directory" },
] as const

export async function StudySampleImages({ locale }: { locale: LandingLocale }) {
    const t = await getTranslations({ locale, namespace: "landing.lieferumfang.sample" })

    return (
        <div className="mt-10">
            <h3 className="font-semibold text-foreground">{t("title")}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("note")}</p>

            <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {PAGINAS.map(({ arquivo, chave }) => {
                    const legenda = t(`captions.${chave}`)

                    return (
                        <li key={arquivo}>
                            {/* Abre a página em tamanho cheio numa aba nova: quem quer
                                ler o índice inteiro consegue, sem carregar biblioteca
                                de lightbox numa página que hoje não tem JavaScript
                                próprio nenhum. */}
                            <a
                                href={`/estudo-exemplo/${arquivo}.webp`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block overflow-hidden rounded-md border border-border bg-background transition hover:border-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                            >
                                <Image
                                    src={`/estudo-exemplo/${arquivo}.webp`}
                                    alt={legenda}
                                    width={1000}
                                    height={1413}
                                    sizes="(min-width: 640px) 25vw, 50vw"
                                    loading="lazy"
                                    className="h-auto w-full"
                                />
                            </a>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">{legenda}</p>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
