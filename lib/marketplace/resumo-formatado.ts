// lib/marketplace/resumo-formatado.ts

import sanitizeHtml from "sanitize-html"
import { normalizarTextoColado } from "./texto-colado"

/**
 * O resumo do estudo nasceu como texto puro — o admin colava do PDF num
 * `textarea`. Agora ele é editado com formatação (negrito, itálico, listas e
 * títulos), então o campo guarda HTML.
 *
 * As listas antigas continuam em texto puro no banco. Por isso as duas formas
 * convivem: `htmlDaIntroducao` reconhece qual é o caso e devolve HTML seguro
 * para a tela e para o editor, sem precisar de backfill.
 */

/**
 * Tags que o resumo aceita.
 *
 * É de propósito uma lista menor que a do blog: imagem e tabela não têm lugar
 * num resumo de vendas, e deixá-las fora elimina de uma vez o risco de colar do
 * PDF uma tabela de dados que vira uma bagunça na ficha da lista.
 */
const TAGS_PERMITIDAS = [
    "a", "b", "br", "del", "em", "h2", "h3", "h4",
    "i", "li", "ol", "p", "s", "strong", "u", "ul",
]

const ATRIBUTOS_PERMITIDOS = {
    a: ["href", "title", "target"],
}

/** Reconhece marcação conhecida; texto puro com "<" solto não vira HTML. */
const MARCA_HTML =
    /<\/?(?:p|br|strong|b|em|i|u|s|del|ul|ol|li|h[2-4]|a|div|span|script|style|img|table|thead|tbody|tr|td|th)\b[^>]*>/i

/** Escape para o caminho de texto puro, em que o conteúdo é digitado pelo admin. */
function escaparHtml(texto: string): string {
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

/**
 * Sanitiza o HTML do resumo no SERVIDOR e também antes de renderizar.
 *
 * O editor já limpa a colagem, mas a action é a última palavra: a sanitização
 * não pode depender de o cliente ter passado pelo editor.
 */
export function sanitizeResumoHtml(html: string): string {
    return sanitizeHtml(html, {
        allowedTags: TAGS_PERMITIDAS,
        allowedAttributes: ATRIBUTOS_PERMITIDOS,
        allowedSchemes: ["http", "https", "mailto", "tel"],
        allowedSchemesAppliedToAttributes: ["href"],
        allowProtocolRelative: false,
        nonTextTags: ["script", "style", "textarea", "option", "noscript"],
        parseStyleAttributes: false,
    }).trim()
}

/** Um HTML só com parágrafos vazios não é conteúdo. */
function temConteudo(html: string): boolean {
    const texto = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()

    return texto.length > 0
}

/**
 * Converte texto puro (o formato antigo, com parágrafos separados por linha em
 * branco) em HTML.
 *
 * Itens de lista já vêm com o marcador do PDF ("• …") e viram `<ul>` de
 * verdade. O resto é parágrafo — a formatação fina quem dá é a barra do editor.
 */
export function textoParaHtml(texto: string): string {
    const normalizado = normalizarTextoColado(texto)
    if (!normalizado) return ""

    const partes: string[] = []
    let listaAberta = false

    for (const bloco of normalizado.split("\n\n")) {
        const linhas = bloco.split("\n")
        const item = /^[•·▪‣◦∙*]\s+(.*)$/.exec(linhas[0] ?? "")

        if (item) {
            if (!listaAberta) {
                partes.push("<ul>")
                listaAberta = true
            }
            const conteudo = [item[1], ...linhas.slice(1)].join(" ")
            partes.push(`<li>${escaparHtml(conteudo)}</li>`)
            continue
        }

        if (listaAberta) {
            partes.push("</ul>")
            listaAberta = false
        }

        partes.push(`<p>${escaparHtml(linhas.join("\n")).replace(/\n/g, "<br>")}</p>`)
    }

    if (listaAberta) partes.push("</ul>")

    return partes.join("")
}

/**
 * HTML seguro da introdução, para renderizar na ficha da lista e para carregar
 * no editor.
 *
 * - introdução gravada como HTML (nova): sanitiza;
 * - introdução gravada como texto puro (antiga): converte com a mesma limpeza
 *   de colagem usada na leitura pública, mantendo as listas antigas legíveis.
 */
export function htmlDaIntroducao(introducao: string | null | undefined): string | null {
    const bruto = introducao?.trim()
    if (!bruto) return null

    const html = MARCA_HTML.test(bruto)
        ? sanitizeResumoHtml(bruto)
        : textoParaHtml(bruto)

    return html && temConteudo(html) ? html : null
}

/** O que a action grava: HTML sanitizado ou `null` quando não há conteúdo. */
export function introducaoParaGravar(valor: string | undefined): string | null {
    return htmlDaIntroducao(valor)
}
