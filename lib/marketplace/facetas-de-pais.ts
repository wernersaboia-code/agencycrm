// lib/marketplace/facetas-de-pais.ts

import { nomeDePais, normalizaCodigoDePais, validaCodigoDePais } from "@/lib/i18n/nome-de-pais"

export interface FacetaDePais {
    code: string
    nome: string
    count: number
}

/**
 * As facetas de país do filtro, derivadas do próprio catálogo.
 *
 * Antes elas saíam de uma lista curada à mão, e o filtro só mostrava país que
 * alguém tivesse cadastrado ali — 23 países chegaram a ficar publicados e
 * invisíveis por causa disso. Agora a fonte é o catálogo: quem tem estudo vira
 * opção, e publicar estudo de país novo não exige commit nenhum.
 *
 * A contagem zero deixa de ser possível por construção (a chave só existe se
 * houver estudo). A exceção continua sendo a faceta selecionada, que fica
 * visível mesmo zerada — senão um filtro vindo de link antigo ficaria aplicado
 * sem aparecer para ser desmarcado.
 *
 * A ordem é a do nome traduzido, então ela MUDA com o idioma — que é o certo:
 * quem lê em alemão espera a lista em ordem alfabética alemã.
 */
export function facetasDePais(
    contagens: Record<string, number>,
    selecionados: readonly string[],
    locale: string,
    excecoes: Record<string, string> = {}
): FacetaDePais[] {
    const codigos = new Set<string>()
    for (const bruto of Object.keys(contagens)) codigos.add(normalizaCodigoDePais(bruto))
    for (const bruto of selecionados) codigos.add(normalizaCodigoDePais(bruto))

    return [...codigos]
        // Dado legado ou digitado errado antes do gate existir: uma faceta que
        // não é país não filtra nada útil e só suja a barra lateral.
        .filter((code) => validaCodigoDePais(code).ok)
        .map((code) => ({
            code,
            nome: nomeDePais(code, locale, excecoes),
            count: contagens[code] ?? 0,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome, locale))
}
