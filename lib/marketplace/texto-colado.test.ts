// lib/marketplace/texto-colado.test.ts
import { describe, it, expect } from "vitest"

import { normalizarTextoColado, paragrafosDaIntroducao } from "./texto-colado"

/**
 * Os trechos abaixo são recortes REAIS de textos da tabela `lead_lists`, colados
 * de PDF. O que se testa aqui é a regressão que chegou ao site: a introdução
 * renderizada com as quebras de linha do documento.
 */
describe("normalizarTextoColado", () => {
    it("devolve vazio para campo vazio", () => {
        expect(normalizarTextoColado(null)).toBe("")
        expect(normalizarTextoColado(undefined)).toBe("")
        expect(normalizarTextoColado("")).toBe("")
        expect(normalizarTextoColado("   \n\n  ")).toBe("")
    })

    it("não mexe em texto já escrito em parágrafos", () => {
        const limpo =
            "Germany is the largest consumer market in the European Union: around 84 million inhabitants.\n\n" +
            "FMCG goods live on rotation, not on margin per unit."

        expect(normalizarTextoColado(limpo)).toBe(limpo)
    })

    it("junta as linhas visuais do PDF num parágrafo só", () => {
        // fmcg-market-norway, como está gravado hoje.
        const colado = [
            "1. Executive Summary",
            "Norway is a small but exceptionally affluent market for baby and toddler products. With about",
            "55,400 births in 2025 and one of the highest purchasing powers in Europe, Norwegian parents",
            "spend well above the European average per child.",
        ].join("\n")

        expect(normalizarTextoColado(colado)).toBe(
            "1. Executive Summary\n\n" +
                "Norway is a small but exceptionally affluent market for baby and toddler products. With about " +
                "55,400 births in 2025 and one of the highest purchasing powers in Europe, Norwegian parents " +
                "spend well above the European average per child."
        )
    })

    it("limpa descrição colada do PDF sem inventar parágrafos", () => {
        // baby-and-toddler-products-united-kingdom, como está gravado hoje.
        const colada = [
            "Baby & Toddler Products in the United",
            "Kingdom",
            "",
            "Market volume, key players, opportunities, market access requirements and a directory of",
            "importers, distributors and directly importing retailers for foreign suppliers",
        ].join("\n")

        expect(normalizarTextoColado(colada)).toBe(
            "Baby & Toddler Products in the United Kingdom\n\n" +
                "Market volume, key players, opportunities, market access requirements and a directory of " +
                "importers, distributors and directly importing retailers for foreign suppliers"
        )
    })

    it("preserva a linha em branco como separador de parágrafo", () => {
        const colado = "Executive Summary\n\nFirst paragraph that was wrapped in the\nPDF layout.\n\nSecond paragraph."

        expect(normalizarTextoColado(colado)).toBe(
            "Executive Summary\n\nFirst paragraph that was wrapped in the PDF layout.\n\nSecond paragraph."
        )
    })

    it("mantém o hífen do composto partido no fim da linha, sem espaço", () => {
        // Todas as 20 ocorrências medidas no banco são compostos de verdade.
        expect(normalizarTextoColado("appoint an EU-\nbased responsible person")).toBe(
            "appoint an EU-based responsible person"
        )
        expect(normalizarTextoColado("receptive to well-\ndesigned innovation")).toBe(
            "receptive to well-designed innovation"
        )
        expect(normalizarTextoColado("via the general e-\nmail address")).toBe(
            "via the general e-mail address"
        )
    })

    it("recompõe o intervalo partido no travessão", () => {
        expect(normalizarTextoColado("Recent import volumes are in the range of 50,000–\n70,000 t per year.")).toBe(
            "Recent import volumes are in the range of 50,000–70,000 t per year."
        )
    })

    it("dá parágrafo próprio a cada item de lista, juntando o texto do item", () => {
        const colado = [
            "Executive summary",
            "This study assesses the German market for bright yellow granular (formed) elemental sulphur.",
            "• Germany is a mature, mid-sized and structurally changing sulphur market. Domestic sulphur",
            "recovered from sour-gas processing fell from about 1.1 million tonnes in 2000.",
            "• The addressable import market for solid granular sulphur is niche but real.",
        ].join("\n")

        expect(normalizarTextoColado(colado)).toBe(
            "Executive summary\n\n" +
                "This study assesses the German market for bright yellow granular (formed) elemental sulphur.\n\n" +
                "• Germany is a mature, mid-sized and structurally changing sulphur market. Domestic sulphur " +
                "recovered from sour-gas processing fell from about 1.1 million tonnes in 2000.\n\n" +
                "• The addressable import market for solid granular sulphur is niche but real."
        )
    })

    it("separa títulos de seção numerados do texto seguinte", () => {
        const colado = [
            "2. What Is FMCG?",
            "Fast-moving consumer goods are products that are sold quickly and at a relatively low cost.",
            "2.1 Size and dynamics",
            "The market grew by 3.5 % in 2025.",
        ].join("\n")

        expect(normalizarTextoColado(colado)).toBe(
            "2. What Is FMCG?\n\n" +
                "Fast-moving consumer goods are products that are sold quickly and at a relatively low cost.\n\n" +
                "2.1 Size and dynamics\n\n" +
                "The market grew by 3.5 % in 2025."
        )
    })

    it("NÃO parte a frase quando a linha começa por número decimal", () => {
        // O falso positivo que este teste existe para impedir: "3.5" e "2026"
        // começam por dígito, mas são texto corrido, não título de seção.
        const colado = [
            "The market reached",
            "3.5 million tonnes in 2025. 2026 is an extraordinary year for prices, with sulphur prices",
            "hitting all-time records.",
        ].join("\n")

        expect(normalizarTextoColado(colado)).toBe(
            "The market reached 3.5 million tonnes in 2025. 2026 is an extraordinary year for prices, " +
                "with sulphur prices hitting all-time records."
        )
    })

    it("não funde as linhas de um sumário com pontilhado", () => {
        const sumario = [
            "Table of Contents",
            "1. Executive Summary.............................................................................................................................................................3",
            "2. Market Overview and Market Volume....................................................................................................................3",
        ].join("\n")

        expect(normalizarTextoColado(sumario).split("\n\n")).toHaveLength(3)
    })

    it("limpa os invisíveis da extração de PDF", () => {
        const sujo = "Baby & Toddler Products in the United\u00a0Kingdom\u200b, with\u00adout\u2028breaks\ttabs   here."

        expect(normalizarTextoColado(sujo)).toBe("Baby & Toddler Products in the United Kingdom, without breaks tabs here.")
    })

    it("é idempotente", () => {
        const amostras = [
            "1. Executive Summary\nNorway is a small but exceptionally affluent market. With about\n55,400 births.",
            "Executive summary\n• Item one wrapped in the\nPDF layout.\n• Item two.",
            "Two clean paragraphs.\n\nWith the second one.",
            "Single line with no break at all.",
        ]

        for (const amostra of amostras) {
            const uma = normalizarTextoColado(amostra)
            expect(normalizarTextoColado(uma)).toBe(uma)
        }
    })
})

describe("paragrafosDaIntroducao", () => {
    it("limpa na leitura, sem depender do banco já estar corrigido", () => {
        const gravadaNoBanco =
            "Executive Summary\nDenmark is a small but affluent, design-conscious and highly digital market.\n\n" +
            "Key facts for foreign suppliers follow."

        expect(paragrafosDaIntroducao(gravadaNoBanco)).toEqual([
            "Executive Summary",
            "Denmark is a small but affluent, design-conscious and highly digital market.",
            "Key facts for foreign suppliers follow.",
        ])
    })

    it("devolve lista vazia para campo vazio", () => {
        expect(paragrafosDaIntroducao(null)).toEqual([])
        expect(paragrafosDaIntroducao("  ")).toEqual([])
    })
})
