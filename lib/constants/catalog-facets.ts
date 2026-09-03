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
 * `catalog.industries.*`. Setor novo exige o rótulo nos sete idiomas — o teste
 * de paridade em `lib/i18n/messages-integridade.test.ts` cobra isso.
 *
 * A busca tem duas dimensões e só duas: PAÍS e SETOR — mas só SETOR mora aqui.
 *
 * País saiu deste arquivo. Era uma lista curada à mão, e o filtro percorria a
 * lista em vez do banco: país sem entrada aqui ficava publicado e invisível,
 * o que chegou a acontecer com 23 deles de uma vez. Como país é padrão
 * internacional e não vocabulário nosso, a faceta passou a ser derivada do
 * próprio catálogo, com o nome vindo do ICU do runtime nos sete idiomas —
 * ver `lib/marketplace/facetas-de-pais.ts` e `lib/i18n/nome-de-pais.ts`.
 *
 * Setor fica, e deve ficar: "HoReCa" e "FMCG" são linguagem do negócio, que
 * nenhum runtime conhece. Aqui a curadoria é o ponto, não o custo.
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
 *
 * `snacks_bars` cobre o estudo "Fruit Bars and Cereal Bars" — barra de fruta e
 * de cereal saem juntas no mesmo arquivo, e o rótulo curto ainda aceita um
 * estudo de snack salgado depois. Não foi para dentro de `fmcg`: quem filtra
 * FMCG procura diretório amplo de país, e misturar uma categoria só na mesma
 * faceta troca granularidade por volume.
 *
 * Não existe `baby_products` ainda, e a ausência é deliberada: só entra quando
 * houver estudo de artigos infantis publicado, porque faceta sem lista por trás
 * é promessa de catálogo que não existe.
 */
export const INDUSTRY_IDS = [
    "exotic_fruits",
    "fmcg",
    "horeca",
    "snacks_bars",
    "toys",
] as const

export type IndustryId = (typeof INDUSTRY_IDS)[number]

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
    // Só a quantidade importa: serve tanto para a lista de ids de setor quanto
    // para as facetas de país, que já vêm como objeto com nome e contagem.
    visiveis: readonly unknown[],
    selecionados: readonly string[]
): boolean {
    return visiveis.length > 1 || selecionados.length > 0
}
