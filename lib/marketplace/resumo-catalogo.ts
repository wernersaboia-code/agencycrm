// lib/marketplace/resumo-catalogo.ts
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

/** Tag revalidada sempre que o admin mexe num estudo. */
export const TAG_RESUMO_CATALOGO = "resumo-catalogo"

export type ResumoCatalogo = {
    estudos: number
    paises: number
    setores: number
    revisadoEm: Date | null
}

/**
 * O tamanho real do catálogo, para a faixa de números da home.
 *
 * Estes números NÃO podem morar em `messages/`. O catálogo cresce sem aviso —
 * entre 31/08 e 02/09/2026 ele passou de 49 para 61 estudos, e um número
 * cravado no arquivo de textos já estava mentindo. Ler do banco é o que faz a
 * faixa continuar respeitando a regra "nenhum número sem base".
 *
 * Espelha `getFilterCounts()` em `actions/marketplace.ts`, que percorre a mesma
 * consulta. A diferença é que aqui interessa a CONTAGEM DE CHAVES DISTINTAS, e
 * não o mapa de ocorrências: 61 estudos cobrem 49 países, não 61.
 *
 * `paises` também não é `COUNTRY_CODES.length`. O vocabulário de facetas conhece
 * 30 códigos e o catálogo tem 49 países — são coisas diferentes, e confundi-las
 * mostraria um número menor que a verdade.
 *
 * Em cache com tag porque isto entra na HOME, a página mais visitada, e o
 * catálogo muda algumas vezes por mês. Ao contrário da amostra grátis, aqui não
 * há caso P2021 a tolerar: `lead_lists` sempre existe. Qualquer erro é relançado
 * de propósito — a Suspense boundary da seção cai sozinha, o Sentry registra, e
 * o resto da home continua de pé.
 */
export const getResumoCatalogo = unstable_cache(
    async (): Promise<ResumoCatalogo> => {
        const estudos = await prisma.leadList.findMany({
            where: { isActive: true },
            select: { countries: true, industries: true, dataReviewedAt: true },
        })

        const paises = new Set<string>()
        const setores = new Set<string>()
        let revisadoEm: Date | null = null

        for (const estudo of estudos) {
            estudo.countries.forEach((pais) => paises.add(pais))
            estudo.industries.forEach((setor) => setores.add(setor))

            if (estudo.dataReviewedAt && (!revisadoEm || estudo.dataReviewedAt > revisadoEm)) {
                revisadoEm = estudo.dataReviewedAt
            }
        }

        return {
            estudos: estudos.length,
            paises: paises.size,
            setores: setores.size,
            revisadoEm,
        }
    },
    ["resumo-catalogo"],
    { tags: [TAG_RESUMO_CATALOGO] }
)
