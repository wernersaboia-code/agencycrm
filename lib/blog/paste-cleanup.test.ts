import { describe, it, expect } from "vitest"
import { limparHtmlDeColagem } from "./paste-cleanup"

/**
 * Texto visível, sem tags.
 *
 * A distinção entre bloco e inline não é capricho: `</p>` produz separação
 * visual, `</span>` não. Tratar as duas igual quebra a comparação nos dois
 * sentidos — trocar toda tag por espaço fazia a entrada com <span> divergir da
 * saída sem ele (e foi assim que uma função que inseria espaço no texto do
 * autor passou no teste); não trocar nenhuma cola dois parágrafos num só.
 */
function textoVisivel(html: string): string {
    return html
        .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, " ")
        .replace(/<(br|hr)\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

describe("limparHtmlDeColagem", () => {
    it("descarta font-family, font-size e cor do Word", () => {
        const colado =
            '<p class="MsoNormal" style="font-family:Calibri; font-size:11pt; color:#1F497D">Texto</p>'
        const limpo = limparHtmlDeColagem(colado)

        expect(limpo).not.toMatch(/font-family/i)
        expect(limpo).not.toMatch(/font-size/i)
        expect(limpo).not.toMatch(/color/i)
        expect(limpo).not.toMatch(/MsoNormal/)
        expect(limpo).toContain("Texto")
    })

    it("PRESERVA text-align — é a centralização que o autor aplicou", () => {
        const limpo = limparHtmlDeColagem('<p style="text-align: center; font-size: 14pt">Meio</p>')

        expect(limpo).toMatch(/text-align:\s*center/)
        expect(limpo).not.toMatch(/font-size/i)
    })

    it("converte negrito e itálico do Google Docs em marcação semântica", () => {
        expect(limparHtmlDeColagem('<span style="font-weight:700">Forte</span>')).toBe(
            "<strong>Forte</strong>"
        )
        expect(limparHtmlDeColagem('<span style="font-style:italic">Ênfase</span>')).toBe(
            "<em>Ênfase</em>"
        )
    })

    it("converte b e i em strong e em", () => {
        expect(limparHtmlDeColagem("<b>a</b><i>b</i>")).toBe("<strong>a</strong><em>b</em>")
    })

    it("desembrulha span que ficou sem atributo, mantendo o texto", () => {
        expect(limparHtmlDeColagem('<p><span style="font-size:12pt">Frase</span></p>')).toBe(
            "<p>Frase</p>"
        )
    })

    it("não insere espaço ao desembrulhar span colado a pontuação ou palavra", () => {
        expect(limparHtmlDeColagem('<p>com <span style="color:red">cor</span>.</p>')).toBe(
            '<p>com cor.</p>'
        )
        expect(limparHtmlDeColagem('<p>uma<span style="color:red">palavra</span>junta</p>')).toBe(
            '<p>umapalavrajunta</p>'
        )
    })

    it("remove parágrafos vazios que o Word gera em série", () => {
        const limpo = limparHtmlDeColagem("<p>Um</p><p></p><p>&nbsp;</p><p> </p><p>Dois</p>")

        expect(limpo).toBe("<p>Um</p><p>Dois</p>")
    })

    it("remove comentários condicionais do Word", () => {
        const limpo = limparHtmlDeColagem("<!--[if gte mso 9]><xml>lixo</xml><![endif]--><p>Ok</p>")

        expect(limpo).toBe("<p>Ok</p>")
    })

    it("mantém a estrutura que o autor quer: títulos, listas e links — imagem colada é descartada de propósito ({ descartarImagens: true })", () => {
        const colado =
            '<h2 style="font-family:Arial">Título</h2>' +
            "<ul><li>Item</li></ul>" +
            '<a href="https://exemplo.com" style="color:#0000EE">Link</a>' +
            '<img src="https://exemplo.com/a.png" alt="Alt">'
        const limpo = limparHtmlDeColagem(colado, { descartarImagens: true })

        expect(limpo).toContain("<h2>Título</h2>")
        expect(limpo).toContain("<li>Item</li>")
        expect(limpo).toContain('href="https://exemplo.com"')
        // Imagem no artigo entra só pelo botão de imagem, que exige alt.
        expect(limpo).not.toContain("<img")
    })

    it("descarta <img> colado inteiramente com { descartarImagens: true }, mesmo com src e alt válidos, mantendo o texto ao redor intacto", () => {
        const colado =
            '<p>Antes.</p><img src="https://exemplo.com/a.png" alt="Alt"><p>Depois.</p>'
        const limpo = limparHtmlDeColagem(colado, { descartarImagens: true })

        expect(limpo).not.toContain("<img")
        expect(limpo).not.toContain("Alt")
        expect(limpo).toContain("<p>Antes.</p>")
        expect(limpo).toContain("<p>Depois.</p>")
    })

    it("sem a opção (default), preserva <img> com src e alt intactos — é o que sobrevive ao salvamento do post", () => {
        const colado =
            '<p>Antes.</p><img src="https://exemplo.com/a.png" alt="x"><p>Depois.</p>'
        const limpo = limparHtmlDeColagem(colado)

        expect(limpo).toContain('<img src="https://exemplo.com/a.png" alt="x"')
        expect(limpo).toContain("<p>Antes.</p>")
        expect(limpo).toContain("<p>Depois.</p>")
    })

    it("não altera uma letra do texto visível", () => {
        const colado =
            '<p class="MsoNormal" style="font-family:Calibri">Primeiro <b>parágrafo</b> com ' +
            '<span style="color:red">cor</span>.</p><p>&nbsp;</p><p>Segundo.</p>'

        expect(textoVisivel(limparHtmlDeColagem(colado))).toBe(
            textoVisivel(colado)
        )
    })

    it("aguenta entrada vazia e HTML malformado", () => {
        expect(limparHtmlDeColagem("")).toBe("")
        expect(limparHtmlDeColagem("<p>sem fechar")).toContain("sem fechar")
    })
})
