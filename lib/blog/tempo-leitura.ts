// lib/blog/tempo-leitura.ts

/** Palavras por minuto. 200 é a média de leitura silenciosa em prosa. */
const PALAVRAS_POR_MINUTO = 200

/**
 * Minutos de leitura de um post, para o card do blog.
 *
 * Piso de 1: "0 min" não informa nada, e um post curtíssimo ainda custa a
 * atenção de abrir. A marcação de `contentHtml` sai antes da contagem, senão
 * as tags inflariam o número num corpo de post normal.
 */
export function minutosDeLeitura(texto: string): number {
    const limpo = texto.replace(/<[^>]*>/g, " ").trim()
    if (!limpo) return 1

    const palavras = limpo.split(/\s+/).length
    return Math.max(1, Math.ceil(palavras / PALAVRAS_POR_MINUTO))
}
