// lib/marketplace/pdf-conteudo.ts
//
// Ponte entre os PDFs (antigo e novo) e a comparação pura de
// conteudo-preservado.ts. Como pdf-contatos.ts, é aqui que mora a dependência
// do pdf.js (unpdf).
import { extractText, getDocumentProxy } from "unpdf"
import { compararConteudo, type ComparacaoDeConteudo } from "./conteudo-preservado"

async function textoPorPagina(bytes: Uint8Array): Promise<string[]> {
    // Cópia: o pdf.js pode transferir (e esvaziar) o buffer que recebe, e quem
    // chama ainda usa os bytes depois.
    const documento = await getDocumentProxy(new Uint8Array(bytes))
    const { text } = await extractText(documento, { mergePages: false })
    return text
}

/**
 * Confere se o PDF novo traz todo o miolo do antigo.
 *
 * `null` quando o PDF ANTIGO não abre: sem referência não há o que conferir, e
 * a conferência não pode impedir a troca justamente de um arquivo quebrado. Se
 * o NOVO não abre, a comparação reprova (sem texto, nada a garantir).
 */
export async function compararConteudoDosPdfs(
    antigo: Uint8Array,
    novo: Uint8Array
): Promise<ComparacaoDeConteudo | null> {
    let paginasAntigas: string[]
    try {
        paginasAntigas = await textoPorPagina(antigo)
    } catch (error) {
        console.error("[PDF] Não foi possível ler o estudo atual para comparar:", error)
        return null
    }

    let paginasNovas: string[] = []
    try {
        paginasNovas = await textoPorPagina(novo)
    } catch (error) {
        console.error("[PDF] Não foi possível ler o estudo novo para comparar:", error)
    }

    return compararConteudo(paginasAntigas, paginasNovas)
}
