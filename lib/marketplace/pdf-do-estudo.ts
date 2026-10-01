// lib/marketplace/pdf-do-estudo.ts
//
// Ponte entre o PDF do estudo e a extração pura de resumo-do-estudo.ts.
//
// Fica separado de propósito, como pdf-contatos.ts: aqui mora a única
// dependência do pdf.js (unpdf), e o teste das regras de extração não precisa
// carregar nenhum PDF.
import { getDocumentProxy } from "unpdf"
import { extrairResumoExecutivo, montarLinhas, type ItemDeTexto } from "./resumo-do-estudo"
import { normalizarTextoColado } from "./texto-colado"

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

        const resumo = extrairResumoExecutivo(montarLinhas(paginas))
        return resumo ? normalizarTextoColado(resumo) : null
    } catch (error) {
        console.error("[PDF] Não foi possível ler o estudo para extrair o resumo:", error)
        return null
    }
}
