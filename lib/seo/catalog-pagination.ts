export type CatalogSearchParams = {
    countries?: string
    industries?: string
    languages?: string
    search?: string
    page?: string
}

/**
 * Página da listagem SEM filtro nenhum, ou 1 quando não é esse caso.
 *
 * Existe por causa do canonical do catálogo, e a distinção é a seguinte:
 *
 * - Visão filtrada (`?industries=horeca`) é um recorte do mesmo conjunto e
 *   canoniza para `/catalog`. Sem isso, cada combinação de faceta viraria uma
 *   URL concorrente e o índice encheria de quase-duplicatas — são 5 setores e
 *   62 países no catálogo de hoje.
 * - Página 2 da listagem sem filtro NÃO é a página 1: traz outros 12 estudos.
 *   Precisa de canonical próprio.
 *
 * Enquanto as duas canonizavam igual, a página 2 dizia ao Google "sou
 * duplicata da 1" — e duplicata declarada é rastreada com prioridade baixa.
 * Os 65 estudos que só aparecem da página 2 em diante ficavam com o sinal de
 * descoberta mais fraco do site, que é o desenho de "Detectada, mas não
 * indexada": em 02.09.2026 havia 312 URLs paradas nesse balde do Search
 * Console.
 *
 * Filtro + paginação continua colapsando em `/catalog`: é faceta profunda, e
 * indexar `?industries=horeca&page=3` seria a explosão combinatória de novo.
 */
export function paginaSemFiltro(params: CatalogSearchParams): number {
    if (params.countries || params.industries || params.languages || params.search) return 1

    const page = Math.floor(Number(params.page ?? 1))
    return Number.isFinite(page) && page > 1 ? page : 1
}
