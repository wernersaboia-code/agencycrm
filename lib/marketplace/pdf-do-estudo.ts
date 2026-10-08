// lib/marketplace/pdf-do-estudo.ts
//
// Ponte entre o PDF do estudo e as extrações puras de resumo-do-estudo.ts e
// contagem-empresas.ts.
//
// Fica separado de propósito, como pdf-contatos.ts: aqui mora a única
// dependência do pdf.js (unpdf), e o teste das regras de extração não precisa
// carregar nenhum PDF.
import { getDocumentProxy } from "unpdf"
import { extrairResumoExecutivo, montarLinhas, type ItemDeTexto, type LinhaDoEstudo } from "./resumo-do-estudo"
import { contarEmpresas, type ContagemDeEmpresas } from "./contagem-empresas"
import { normalizarTextoColado } from "./texto-colado"

/** Lê o texto do PDF, linha a linha, com altura e posição de cada linha. */
async function lerLinhas(bytes: Uint8Array): Promise<LinhaDoEstudo[]> {
    const documento = await getDocumentProxy(bytes)
    const paginas: ItemDeTexto[][] = []

    for (let numero = 1; numero <= documento.numPages; numero++) {
        const pagina = await documento.getPage(numero)
        const conteudo = await pagina.getTextContent()

        paginas.push(
            conteudo.items.flatMap((item) =>
                "str" in item
                    ? [{ texto: item.str, altura: item.height, y: item.transform[5] }]
                    : []
            )
        )
    }

    return montarLinhas(paginas)
}

/**
 * Lê o PDF do estudo e devolve o resumo executivo pronto para gravar na
 * introdução da lista: parágrafos de verdade, sem as quebras de linha da
 * diagramação do PDF.
 *
 * `null` quando o PDF não abre (corrompido, protegido por senha, só imagem) ou
 * quando nenhuma primeira seção é reconhecida. Devolver `null` é o contrato:
 * quem chama não sobrescreve uma introdução existente por causa de uma leitura
 * que falhou.
 */
export async function extrairResumoDoPdf(bytes: Uint8Array): Promise<string | null> {
    try {
        const resumo = extrairResumoExecutivo(await lerLinhas(bytes))
        return resumo ? normalizarTextoColado(resumo) : null
    } catch (error) {
        console.error("[PDF] Não foi possível ler o estudo para extrair o resumo:", error)
        return null
    }
}

/**
 * Estimativa de empresas do diretório do estudo (ver contagem-empresas.ts).
 * `null` quando o PDF não abre ou não tem capítulo de diretório — quem chama
 * mantém o número anterior em vez de gravar zero.
 */
export async function contarEmpresasDoPdf(bytes: Uint8Array): Promise<ContagemDeEmpresas | null> {
    try {
        const linhas = await lerLinhas(bytes)
        return contarEmpresas(linhas.map((linha) => linha.texto))
    } catch (error) {
        console.error("[PDF] Não foi possível ler o estudo para contar as empresas:", error)
        return null
    }
}
