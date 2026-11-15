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

// ============================================
// ORDENAÇÃO
// ============================================

/** Colunas que dá para ordenar. Sem `sort` na URL, vale a mais recente primeiro. */
export const COLUNAS_ORDENAVEIS = ["name", "companies", "sales", "price"] as const
export type ColunaOrdenavel = (typeof COLUNAS_ORDENAVEIS)[number]
export type Direcao = "asc" | "desc"

export interface ListaOrdenavel {
    name: string
    createdAt: Date
    companyCount: number | null
    price: number | string | { toString(): string }
    _count: { purchaseItems: number }
}

export function lerOrdenacao(sort?: string, dir?: string): { coluna: ColunaOrdenavel; direcao: Direcao } | null {
    if (!sort || !(COLUNAS_ORDENAVEIS as readonly string[]).includes(sort)) return null
    // Nome começa em A→Z; números começam do maior, que é o que se procura
    // primeiro (o estudo com mais empresas, o que mais vendeu, o mais caro).
    const padrao: Direcao = sort === "name" ? "asc" : "desc"
    return { coluna: sort as ColunaOrdenavel, direcao: dir === "asc" || dir === "desc" ? dir : padrao }
}

/**
 * Ordena sem mexer no array de entrada. Estudo sem contagem de empresas vai
 * para o fim nas duas direções: "—" no topo de "mais empresas" não ajuda ninguém.
 * Empate fica pela data de criação, mais recente primeiro, como a tabela vinha.
 */
export function ordenarListas<T extends ListaOrdenavel>(
    listas: readonly T[],
    ordenacao: { coluna: ColunaOrdenavel; direcao: Direcao } | null
): T[] {
    const porData = (a: T, b: T) => b.createdAt.getTime() - a.createdAt.getTime()
    if (!ordenacao) return [...listas].sort(porData)

    const sinal = ordenacao.direcao === "asc" ? 1 : -1
    const valor = (lista: T): number | string | null => {
        switch (ordenacao.coluna) {
            case "name":
                return lista.name
            case "companies":
                return lista.companyCount
            case "sales":
                return lista._count.purchaseItems
            case "price":
                return Number(lista.price.toString())
        }
    }

    return [...listas].sort((a, b) => {
        const va = valor(a)
        const vb = valor(b)
        if (va === null && vb === null) return porData(a, b)
        if (va === null) return 1
        if (vb === null) return -1
        const comparacao =
            typeof va === "string" && typeof vb === "string"
                ? va.localeCompare(vb, undefined, { sensitivity: "base" })
                : (va as number) - (vb as number)
        return comparacao !== 0 ? comparacao * sinal : porData(a, b)
    })
}
