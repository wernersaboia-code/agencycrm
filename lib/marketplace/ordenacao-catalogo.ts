// lib/marketplace/ordenacao-catalogo.ts
//
// Ordenação do catálogo público. Sem acesso ao banco: serve à action que
// consulta e ao seletor no cliente.

/**
 * `featured` é o padrão e não aparece na URL: destaques primeiro, depois os
 * mais recentes. `recent` ignora o destaque. `country` e `industry` ordenam
 * pelo NOME no idioma do visitante — "Alemanha" em pt e "Germany" em en caem
 * em posições diferentes —, e por isso não dá para pedir ao banco.
 */
export const ORDENACOES = ["featured", "recent", "country", "industry"] as const
export type Ordenacao = (typeof ORDENACOES)[number]

export const ORDENACAO_PADRAO: Ordenacao = "featured"

/** Valor de `?sort=` vindo da URL. Qualquer coisa desconhecida vira o padrão. */
export function lerOrdenacao(bruto: string | undefined | null): Ordenacao {
    return ORDENACOES.find((o) => o === bruto) ?? ORDENACAO_PADRAO
}

/** As duas ordenações que dependem do nome traduzido e são feitas em memória. */
export function ordenaPorNome(ordenacao: Ordenacao): ordenacao is "country" | "industry" {
    return ordenacao === "country" || ordenacao === "industry"
}

export interface ItemOrdenavel {
    id: string
    countries: readonly string[]
    industries: readonly string[]
    createdAt: Date
}

interface Nomes {
    /** Nome do país no idioma da página. */
    pais: (codigo: string) => string
    /** Nome do setor no idioma da página. */
    setor: (id: string) => string
}

function collator(locale: string): Intl.Collator {
    try {
        return new Intl.Collator(locale, { sensitivity: "base" })
    } catch {
        return new Intl.Collator("en", { sensitivity: "base" })
    }
}

/**
 * Ordena por país ou por setor, com o outro como desempate e o mais recente
 * por último critério.
 *
 * - País: vale o PRIMEIRO da lista, que é a primeira bandeira do cartão.
 * - Setor: vale o primeiro em ordem alfabética entre os do estudo, para o
 *   resultado não depender da ordem em que foram marcados no admin.
 * - Estudo sem país ou sem setor vai para o fim, em vez de abrir a lista com
 *   um cartão sem o dado pelo qual o visitante pediu para ordenar.
 */
export function ordenarPorNome<T extends ItemOrdenavel>(
    itens: readonly T[],
    ordenacao: "country" | "industry",
    nomes: Nomes,
    locale: string
): T[] {
    const compara = collator(locale)

    const chaves = new Map(
        itens.map((item) => {
            const pais = item.countries.length > 0 ? nomes.pais(item.countries[0]) : null
            const setores = item.industries.map(nomes.setor).sort(compara.compare)
            return [item.id, { pais, setor: setores[0] ?? null }]
        })
    )

    const porNome = (a: string | null, b: string | null) => {
        if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1
        return compara.compare(a, b)
    }

    return [...itens].sort((a, b) => {
        const ka = chaves.get(a.id)!
        const kb = chaves.get(b.id)!
        const primeiro = ordenacao === "country" ? porNome(ka.pais, kb.pais) : porNome(ka.setor, kb.setor)
        if (primeiro !== 0) return primeiro
        const segundo = ordenacao === "country" ? porNome(ka.setor, kb.setor) : porNome(ka.pais, kb.pais)
        if (segundo !== 0) return segundo
        return b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id)
    })
}
