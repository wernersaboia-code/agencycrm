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

/** Sem acento e em minúsculas, para a busca achar "Áustria" digitando "aus". */
function semAcento(texto: string): string {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

/**
 * As facetas como o filtro do catálogo as lista: selecionadas primeiro, depois
 * as de mais estudos, e o alfabeto só desempata.
 *
 * `facetasDePais` devolve ordem alfabética, que serve a quem já sabe o país que
 * procura. Mas o catálogo passou de 60 países, a maioria com um ou dois
 * estudos, e a lista abria em "África do Sul (2)" com a Alemanha (13) fora da
 * caixa. Quem sabe o que quer usa a busca (`termo`); quem está olhando vê
 * primeiro onde há mais oferta.
 */
export function facetasParaOFiltro(
    facetas: readonly FacetaDePais[],
    selecionados: readonly string[],
    termo: string,
    locale: string
): FacetaDePais[] {
    const marcados = new Set(selecionados.map(normalizaCodigoDePais))
    const busca = semAcento(termo.trim())

    return facetas
        .filter((f) => !busca || semAcento(f.nome).includes(busca) || f.code.toLowerCase() === busca)
        .sort(
            (a, b) =>
                Number(marcados.has(b.code)) - Number(marcados.has(a.code)) ||
                b.count - a.count ||
                a.nome.localeCompare(b.nome, locale)
        )
}
