// lib/constants/catalog-facets.ts

/**
 * Vocabulário controlado das facetas do catálogo. Fonte única: o formulário do
 * admin e o filtro público leem daqui.
 *
 * Antes cada lado tinha o seu array, e eles já haviam divergido — o admin
 * oferecia doze setores e o filtro conhecia oito. Uma lista marcada como
 * "agriculture" existia no catálogo mas não tinha faceta nenhuma que a
 * encontrasse.
 *
 * Os rótulos NÃO moram aqui: ficam em `messages/<locale>.json`, sob
 * `catalog.categories.*`, `catalog.industries.*` e `catalog.countries.*`. Id
 * novo aqui exige o rótulo nos sete idiomas — o teste de paridade em
 * `lib/i18n/messages-integridade.test.ts` cobra isso.
 *
 * `foodservice` foi avaliado e deixado de fora: no comércio internacional ele
 * se sobrepõe demais a HORECA, e faceta que o cliente não sabe escolher é pior
 * que faceta a menos. Revisar quando o catálogo tiver volume que justifique.
 */

export const CATEGORY_IDS = [
    "importers",
    "exporters",
    "manufacturers",
    "distributors",
    "retailers",
    "wholesalers",
] as const

export const INDUSTRY_IDS = [
    "fmcg_food",
    "fmcg_nonfood",
    "horeca",
    "tech",
    "fashion",
    "automotive",
    "health",
    "construction",
    "retail",
    "industrial",
    "agriculture",
    "electronics",
    "chemicals",
    "machinery",
] as const

export const COUNTRY_CODES = [
    "DE", "FR", "IT", "ES", "NL", "BE", "PL", "SE",
    "AT", "CH", "PT", "GB", "US", "CN", "JP", "BR",
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]
export type IndustryId = (typeof INDUSTRY_IDS)[number]
export type CountryCode = (typeof COUNTRY_CODES)[number]

/**
 * Quais facetas o filtro público deve mostrar.
 *
 * Só entra o que tem lista publicada por trás: faceta com contagem zero é
 * promessa de catálogo que não existe, e o vocabulário é maior do que a
 * operação de hoje. A exceção é a faceta já selecionada — ela continua visível
 * mesmo zerada, senão um filtro vindo de link antigo ficaria ativo sem
 * aparecer em lugar nenhum para ser desmarcado.
 */
export function visibleFacets<T extends string>(
    ids: readonly T[],
    counts: Record<string, number>,
    selected: readonly string[]
): T[] {
    return ids.filter((id) => (counts[id] ?? 0) > 0 || selected.includes(id))
}

/**
 * Se vale a pena renderizar a seção de filtro.
 *
 * Uma faceta sozinha não oferece escolha — marcar a única opção devolve o mesmo
 * catálogo. A seção só ocupa espaço e sugere que o catálogo está incompleto.
 *
 * A exceção é filtro já ativo: aí a seção fica visível mesmo com uma faceta só,
 * senão um filtro vindo de link antigo ficaria aplicado sem aparecer em lugar
 * nenhum para ser desmarcado.
 */
export function secaoOfereceEscolha(
    visiveis: readonly string[],
    selecionados: readonly string[]
): boolean {
    return visiveis.length > 1 || selecionados.length > 0
}
