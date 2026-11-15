// lib/admin/filtro-listas.ts

/**
 * Filtro da tabela de listas do super-admin.
 *
 * Mora fora da página porque é a única parte com regra de verdade — o resto
 * é JSX — e porque a página do super-admin exige sessão, o que a deixa fora
 * do alcance de qualquer verificação que não seja um teste.
 */

import { conferirDescricao } from "@/lib/marketplace/regra-descricao"

export interface ListaFiltravel {
    name: string
    slug: string
    countries: string[]
    industries: string[]
    isActive: boolean
    isFeatured: boolean
    studyPdfUrl: string | null
    /** Opcional para quem só filtra por nome/país; sem ela, conta como vazia. */
    description?: string | null
}

export interface FiltroListas {
    q?: string
    country?: string
    industry?: string
    status?: string
}

/**
 * Busca por nome OU slug, sem diferenciar acento nem caixa.
 *
 * O acento importa: os estudos convivem em sete idiomas e o admin digita do
 * teclado que tem à mão. Sem normalizar, "frutas exoticas" não acha "Frutas
 * Exóticas" — e é exatamente assim que a maioria digita.
 */
function normalizar(texto: string): string {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
}

/**
 * Descrição que foge da regra do cartão (ver lib/marketplace/regra-descricao.ts).
 * Só lista ATIVA: as inativas não aparecem no catálogo, e os três estudos de
 * teste vazios ficariam acusando para sempre um problema que não existe.
 * O cartão de saúde e o filtro usam esta mesma função, para o número do
 * cartão ser exatamente o que o filtro mostra.
 */
export function temDescricaoForaDaRegra(lista: ListaFiltravel): boolean {
    return lista.isActive && conferirDescricao(lista.description).length > 0
}

export function filtrarListas<T extends ListaFiltravel>(
    listas: readonly T[],
    filtro: FiltroListas
): T[] {
    const busca = normalizar((filtro.q ?? "").trim())

    return listas.filter((lista) => {
        if (busca && !normalizar(`${lista.name} ${lista.slug}`).includes(busca)) return false
        if (filtro.country && !lista.countries.includes(filtro.country)) return false
        if (filtro.industry && !lista.industries.includes(filtro.industry)) return false

        switch (filtro.status) {
            case "active":
                if (!lista.isActive) return false
                break
            case "inactive":
                if (lista.isActive) return false
                break
            case "noPdf":
                if (lista.studyPdfUrl) return false
                break
            case "featured":
                if (!lista.isFeatured) return false
                break
            case "badDescription":
                if (!temDescricaoForaDaRegra(lista)) return false
                break
        }

        return true
    })
}

export function temFiltroAtivo(filtro: FiltroListas): boolean {
    return Boolean(filtro.q?.trim() || filtro.country || filtro.industry || filtro.status)
}
