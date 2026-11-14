// lib/marketplace/resumo-formatado.test.ts
import { describe, it, expect } from "vitest"

import {
    htmlDaIntroducao,
    introducaoParaGravar,
    sanitizeResumoHtml,
    textoParaHtml,
} from "./resumo-formatado"

describe("textoParaHtml", () => {
    it("converte parágrafos separados por linha em branco", () => {
        expect(textoParaHtml("Primeiro parágrafo.\n\nSegundo parágrafo.")).toBe(
            "<p>Primeiro parágrafo.</p><p>Segundo parágrafo.</p>"
        )
    })

    it("converte itens com marcador do PDF em lista de verdade", () => {
        expect(textoParaHtml("• Primeiro item\n\n• Segundo item")).toBe(
            "<ul><li>Primeiro item</li><li>Segundo item</li></ul>"
        )
    })

    it("escapa marcação digitada como texto", () => {
        expect(textoParaHtml("<b>não é negrito</b>")).toBe(
            "<p>&lt;b&gt;não é negrito&lt;/b&gt;</p>"
        )
    })
})

describe("sanitizeResumoHtml", () => {
    it("mantém a formatação que o editor oferece", () => {
        const html = "<p><strong>Forte</strong> e <em>itálico</em></p><ul><li>Item</li></ul>"
        expect(sanitizeResumoHtml(html)).toBe(html)
    })

    it("remove script, imagem e atributos perigosos", () => {
        const html =
            '<p onclick="alert(1)">Texto</p><script>alert(1)</script>' +
            '<img src="https://exemplo.com/x.png" alt="x">' +
            '<a href="javascript:alert(1)">link</a>'

        const limpo = sanitizeResumoHtml(html)

        expect(limpo).toContain("<p>Texto</p>")
        expect(limpo).not.toContain("script")
        expect(limpo).not.toContain("img")
        expect(limpo).not.toContain("javascript:")
        expect(limpo).not.toContain("onclick")
    })
})

describe("htmlDaIntroducao", () => {
    it("devolve null para campo vazio", () => {
        expect(htmlDaIntroducao(null)).toBeNull()
        expect(htmlDaIntroducao(undefined)).toBeNull()
        expect(htmlDaIntroducao("   ")).toBeNull()
        expect(htmlDaIntroducao("<p></p>")).toBeNull()
    })

    it("converte a introdução antiga em texto puro", () => {
        expect(htmlDaIntroducao("Um parágrafo.\n\nOutro.")).toBe(
            "<p>Um parágrafo.</p><p>Outro.</p>"
        )
    })

    it("sanitiza a introdução que já está em HTML", () => {
        expect(htmlDaIntroducao("<p>Texto <strong>forte</strong></p>")).toBe(
            "<p>Texto <strong>forte</strong></p>"
        )
        expect(htmlDaIntroducao("<p>Texto</p><script>alert(1)</script>")).toBe(
            "<p>Texto</p>"
        )
    })

    it("ignora HTML sem conteúdo visível", () => {
        expect(htmlDaIntroducao("<script>alert(1)</script>")).toBeNull()
    })
})

describe("introducaoParaGravar", () => {
    it("grava HTML sanitizado", () => {
        expect(introducaoParaGravar("<p>Texto</p>")).toBe("<p>Texto</p>")
    })

    it("converte texto puro antigo antes de gravar", () => {
        expect(introducaoParaGravar("Texto\n\nOutro")).toBe("<p>Texto</p><p>Outro</p>")
    })

    it("campo vazio vira null", () => {
        expect(introducaoParaGravar("")).toBeNull()
        expect(introducaoParaGravar(undefined)).toBeNull()
    })
})
