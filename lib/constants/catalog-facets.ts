// lib/constants/catalog-facets.ts

/**
 * Regras de exibição das facetas do catálogo.
 *
 * A busca tem duas dimensões e só duas: PAÍS e SETOR — e nenhuma das duas
 * tem mais o vocabulário guardado aqui.
 *
 * Setor saiu deste arquivo em 08.10.2026: o cadastro mora na tabela
 * `industries`, editada em /super-admin/marketplace/industries, para que setor
 * novo não exija deploy. Continua vocabulário curado — a curadoria só mudou de
 * lugar. Ver `lib/marketplace/setores.ts`.
 *
 * País saiu antes. Era uma lista curada à mão, e o filtro percorria a
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

/**
 * Quantos estudos um idioma precisa ter para contar como escolha no filtro.
 */
export const MINIMO_DE_ESTUDOS_POR_IDIOMA = 5

/**
 * Se o filtro de idioma oferece uma escolha de verdade.
 *
 * `secaoOfereceEscolha` não basta aqui: em 10.11.2026 o catálogo tinha 162
 * estudos em inglês, um em português e um em espanhol. Três facetas, mas o
 * filtro só servia para achar dois estudos — e sugeria um catálogo multilíngue
 * que não existe. A seção só aparece quando pelo menos dois idiomas têm
 * estudos suficientes; volta sozinha quando o catálogo ganhar variedade.
 *
 * A exceção do filtro já ativo continua valendo, pelo mesmo motivo das outras
 * seções: link antigo com `?languages=pt` não pode ficar sem ter onde ser
 * desmarcado.
 */
export function idiomaOfereceEscolha(
    contagens: Record<string, number>,
    selecionados: readonly string[]
): boolean {
    if (selecionados.length > 0) return true
    const comVolume = Object.values(contagens).filter((n) => n >= MINIMO_DE_ESTUDOS_POR_IDIOMA)
    return comVolume.length > 1
}
