// lib/admin/filtro-listas.ts

/**
 * Filtro da tabela de listas do super-admin.
 *
 * Mora fora da página porque é a única parte com regra de verdade — o resto
 * é JSX — e porque a página do super-admin exige sessão, o que a deixa fora
 * do alcance de qualquer verificação que não seja um teste.
 */

export interface ListaFiltravel {
    name: string
    slug: string
    countries: string[]
    industries: string[]
    isActive: boolean
    isFeatured: boolean
    studyPdfUrl: string | null
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
        }

        return true
    })
}

export function temFiltroAtivo(filtro: FiltroListas): boolean {
    return Boolean(filtro.q?.trim() || filtro.country || filtro.industry || filtro.status)
}
