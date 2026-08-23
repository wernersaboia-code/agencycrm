// lib/marketplace/pdf-contatos.ts
//
// Ponte entre o PDF enviado e o detector puro de contatos-pessoais.ts.
//
// Fica separado de propósito: as regras de detecção são testadas contra linhas
// de texto, sem PDF nenhum, e é aqui que mora a única dependência de extração
// (unpdf). Assim o teste do detector não precisa carregar pdf.js.
import { extractText, getDocumentProxy } from "unpdf"
import { encontrarContatosPessoais, type Achado } from "./contatos-pessoais"

/**
 * Extrai o texto do PDF e devolve os contatos pessoais encontrados.
 *
 * PDF ilegível (corrompido, protegido por senha ou só imagem) devolve lista
 * vazia em vez de estourar: a validação é uma rede de proteção sobre o upload,
 * não pode ser o motivo de um estudo legítimo não subir. O caso de PDF
 * escaneado é conhecido e aceito — nenhum estudo do catálogo é imagem.
 */
export async function encontrarContatosPessoaisNoPdf(bytes: Uint8Array): Promise<Achado[]> {
    try {
        const documento = await getDocumentProxy(bytes)
        // `mergePages` faz o unpdf devolver uma string única já concatenada.
        const { text } = await extractText(documento, { mergePages: true })
        return encontrarContatosPessoais(text)
    } catch (error) {
        console.error("[PDF] Não foi possível ler o estudo para validar contatos:", error)
        return []
    }
}
