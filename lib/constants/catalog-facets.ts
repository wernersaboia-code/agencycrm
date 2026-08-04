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
 * `catalog.industries.*` e `catalog.countries.*`. Id novo aqui exige o rótulo
 * nos sete idiomas — o teste de paridade em
 * `lib/i18n/messages-integridade.test.ts` cobra isso.
 *
 * A busca tem duas dimensões e só duas: PAÍS e SETOR.
 *
 * A faceta "categoria" (importadores/exportadores/fabricantes…) foi removida:
 * uma mesma lista de país mistura importadores, distribuidores e atacadistas
 * no mesmo arquivo, então nenhum valor único descrevia a lista com honestidade.
 * Faceta que o cliente não consegue escolher direito é pior que faceta nenhuma.
 */

/**
 * Setores. Um por linha de estudo, exatamente como aparece no título dos
 * estudos de entrada de mercado — "Exotic Fruits Market", "FMCG Market",
 * "HoReCa & Foodservice Market".
 *
 * Sem hierarquia e sem subdivisão: FMCG é FMCG, sem separar alimentar de não
 * alimentar, porque numa lista de país os dois vêm no mesmo arquivo. O
 * vocabulário antigo tinha catorze setores genéricos (tech, fashion,
 * automotive…) que nenhum estudo jamais usou.
 */
export const INDUSTRY_IDS = [
    "exotic_fruits",
    "fmcg",
    "horeca",
] as const

/**
 * Países com estudo publicado, mais os que já estavam rotulados nos sete
 * idiomas e podem receber estudo sem custo de tradução.
 *
 * Reino Unido é `GB` (ISO 3166-1), não `UK`.
 */
export const COUNTRY_CODES = [
    // Europa
    "AT", "BE", "CH", "CZ", "DE", "DK", "ES", "FI", "FR", "GB",
    "HR", "IE", "IT", "LU", "NL", "NO", "PL", "PT", "SE", "SI",
    "SK", "TR",
    // Américas
    "AR", "BR", "CO", "EC", "US", "UY", "VE",
    // Ásia
    "CN", "JP",
] as const

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
