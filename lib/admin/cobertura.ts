// lib/admin/cobertura.ts
import { prisma } from "@/lib/prisma"

/**
 * O tamanho do catálogo em termos que importam para quem vende estudo.
 *
 * Substitui o "leads publicados" do painel, que vinha do modelo antigo de lista
 * de leads: no modelo PDF a tabela de leads do marketplace fica vazia e o
 * painel dizia "124 listas ativas · 0 leads publicados", como se houvesse um
 * problema que não existe.
 */
export interface CoberturaDoCatalogo {
    /** Países distintos entre os estudos ativos. */
    paises: number
    estudosAtivos: number
    /** Estudos ativos com a data de revisão dos dados registrada. */
    estudosRevisados: number
}

export function calcularCobertura(
    estudos: { countries: string[]; dataReviewedAt: Date | null }[]
): CoberturaDoCatalogo {
    return {
        paises: new Set(estudos.flatMap((estudo) => estudo.countries)).size,
        estudosAtivos: estudos.length,
        estudosRevisados: estudos.filter((estudo) => estudo.dataReviewedAt !== null).length,
    }
}

export async function getCoberturaDoCatalogo(): Promise<CoberturaDoCatalogo> {
    const estudos = await prisma.leadList.findMany({
        where: { isActive: true },
        select: { countries: true, dataReviewedAt: true },
    })
    return calcularCobertura(estudos)
}
