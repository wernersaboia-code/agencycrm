// lib/marketplace/resumo-do-estudo.test.ts
import { describe, it, expect } from "vitest"

import {
    extrairResumoExecutivo,
    montarLinhas,
    type ItemDeTexto,
    type LinhaDoEstudo,
} from "./resumo-do-estudo"
import { normalizarTextoColado } from "./texto-colado"

/**
 * As medidas abaixo saem dos estudos REAIS, lidos com o pdf.js: corpo em 10,5 pt
 * com ~14 pt entre linhas do mesmo parágrafo e ~20 pt entre parágrafos; título de
 * seção em 15 pt. O que estes testes protegem é a extração automática do resumo
 * executivo para a introdução da lista.
 */

const CORPO = 10.5
const TITULO = 15
const CABECALHO = "The FMCG Market in Egypt — Market Entry Study for Foreign Suppliers"
const RODAPE_1 = "The FMCG Market in Egypt — Market Entry Study for Foreign Suppliers | 1"
const RODAPE_2 = "The FMCG Market in Egypt — Market Entry Study for Foreign Suppliers | 2"
const RODAPE_3 = "The FMCG Market in Egypt — Market Entry Study for Foreign Suppliers | 3"

function linha(texto: string, altura: number, espacoAcima: number, pagina: number): LinhaDoEstudo {
    return { texto, altura, espacoAcima, pagina }
}

/** Estudo no modelo: capa, sumário SEM pontilhado, seção 1 e o começo da 2. */
const ESTUDO: LinhaDoEstudo[] = [
    // Capa
    linha("Market Entry Study", 13, 0, 1),
    linha("The FMCG Market in Egypt", 28, 25, 1),
    linha("A Reference Guide for Foreign Suppliers", 14, 23, 1),
    linha("Edition 2026", 11, 83, 1),
    linha(RODAPE_1, 10, 342, 1),

    // Sumário — este é o caso que derrubava a extração: sem pontilhado nenhum.
    linha(CABECALHO, 7.5, 0, 2),
    linha("Contents", TITULO, 43.5, 2),
    linha("1. Introduction and how to use this study 4", CORPO, 25, 2),
    linha("2. What Is FMCG? 4", CORPO, 18, 2),
    linha("3. Market Overview and Market Volume 6", CORPO, 18, 2),
    linha(RODAPE_2, 10, 462, 2),

    // Seção 1 (dois parágrafos) e o título da seção 2
    linha(CABECALHO, 7.5, 0, 3),
    linha("1. Introduction and how to use this study", TITULO, 43.5, 3),
    linha(
        "Egypt is the most populous country in the Arab world and one of the largest consumer markets in the",
        CORPO,
        21.5,
        3
    ),
    linha(
        "Middle East and Africa. For manufacturers and suppliers of fast-moving consumer goods (FMCG) whose",
        CORPO,
        13.5,
        3
    ),
    linha("brands or products already sell successfully abroad, it offers a sizeable and growing outlet.", CORPO, 13.5, 3),
    linha(
        "This study is written as a stand-alone reference for foreign suppliers. It explains what FMCG covers,",
        CORPO,
        19.5,
        3
    ),
    linha("sizes the Egyptian market, maps the main players and sales channels.", CORPO, 13.5, 3),
    linha("2. What Is FMCG?", TITULO, 35, 3),
    linha("FMCG stands for Fast-Moving Consumer Goods.", CORPO, 27.5, 3),
    linha(RODAPE_3, 10, 462, 3),
]

describe("montarLinhas", () => {
    it("junta itens da mesma coordenada vertical numa linha", () => {
        const itens: ItemDeTexto[] = [
            { texto: "Goods", altura: CORPO, y: 700 },
            { texto: " are", altura: CORPO, y: 700 },
        ]

        expect(montarLinhas([itens])).toEqual([linha("Goods are", CORPO, 0, 1)])
    })

    it("não separa palavra partida em dois pedaços", () => {
        const itens: ItemDeTexto[] = [
            { texto: "Fast-", altura: CORPO, y: 700 },
            { texto: "Moving", altura: CORPO, y: 700 },
        ]

        expect(montarLinhas([itens])[0].texto).toBe("Fast-Moving")
    })

    it("mede o vão entre linhas da mesma página e zera na primeira de cada página", () => {
        const pagina1: ItemDeTexto[] = [
            { texto: "Primeira", altura: CORPO, y: 700 },
            { texto: "Segunda", altura: CORPO, y: 686 },
        ]
        const pagina2: ItemDeTexto[] = [{ texto: "Terceira", altura: CORPO, y: 700 }]

        expect(montarLinhas([pagina1, pagina2]).map((l) => l.espacoAcima)).toEqual([0, 14, 0])
    })

    it("troca o marcador da fonte Symbol (U+F0B7) pelo marcador comum", () => {
        // horeca-foodservice-market-serbia: o Word grava o marcador de lista
        // nesse código de uso privado, e sem a troca os itens grudavam num
        // parágrafo só.
        const itens: ItemDeTexto[] = [
            { texto: "", altura: CORPO, y: 700 },
            { texto: " Market size: Revenue of restaurants.", altura: CORPO, y: 700 },
        ]

        expect(montarLinhas([itens])[0].texto).toBe("• Market size: Revenue of restaurants.")
    })

    it("ignora itens em branco e ordena de cima para baixo", () => {
        const itens: ItemDeTexto[] = [
            { texto: "   ", altura: CORPO, y: 700 },
            { texto: "Embaixo", altura: CORPO, y: 650 },
            { texto: "Em cima", altura: CORPO, y: 720 },
        ]

        expect(montarLinhas([itens]).map((l) => l.texto)).toEqual(["Em cima", "Embaixo"])
    })
})

describe("extrairResumoExecutivo", () => {
    it("devolve a primeira seção em parágrafos, sem índice e sem mobília de página", () => {
        const resumo = extrairResumoExecutivo(ESTUDO)

        expect(resumo).toBe(
            "Egypt is the most populous country in the Arab world and one of the largest consumer markets in the\n" +
                "Middle East and Africa. For manufacturers and suppliers of fast-moving consumer goods (FMCG) whose\n" +
                "brands or products already sell successfully abroad, it offers a sizeable and growing outlet.\n\n" +
                "This study is written as a stand-alone reference for foreign suppliers. It explains what FMCG covers,\n" +
                "sizes the Egyptian market, maps the main players and sales channels."
        )
    })

    it("sai pronto para gravar depois da limpeza de colagem", () => {
        const resumo = extrairResumoExecutivo(ESTUDO)
        const pronto = normalizarTextoColado(resumo)

        expect(pronto.split("\n\n")).toHaveLength(2)
        expect(pronto.startsWith("Egypt is the most populous country")).toBe(true)
        expect(pronto).not.toContain("Contents")
        expect(pronto).not.toContain("FMCG stands for Fast-Moving Consumer Goods")
        expect(pronto).not.toContain("Page 3")
        expect(pronto).not.toContain("Edition 2026")
    })

    it("descarta o índice com pontilhado", () => {
        const comPontilhado: LinhaDoEstudo[] = [
            linha("Table of Contents", TITULO, 0, 1),
            linha("1. Executive Summary" + ".".repeat(80) + "3", CORPO, 25, 1),
            linha("2. Market Overview and Market Volume" + ".".repeat(70) + "3", CORPO, 18, 1),
            linha("1. Executive Summary", TITULO, 40, 2),
            linha("Belgium is a small but affluent, highly urbanised market of about 11.9 million inhabitants.", CORPO, 21.5, 2),
            linha("2. Market Overview and Market Volume", TITULO, 30, 2),
            linha("According to Statbel, 108,033 babies were born in Belgium in 2025.", CORPO, 27.5, 2),
        ]

        expect(extrairResumoExecutivo(comPontilhado)).toBe(
            "Belgium is a small but affluent, highly urbanised market of about 11.9 million inhabitants."
        )
    })

    it("não corta a seção num item numerado que está em corpo de texto", () => {
        const comItemNumerado: LinhaDoEstudo[] = [
            linha("1. Scope", TITULO, 0, 1),
            linha("The guide covers the whole market and the practical questions a supplier asks first.", CORPO, 21.5, 1),
            linha("2. The routes to market are three, and they differ by channel and by product category.", CORPO, 20, 1),
            linha("2. Market Volume", TITULO, 30, 1),
            linha("The market reached EUR 4.7 billion in 2025.", CORPO, 27.5, 1),
        ]

        expect(extrairResumoExecutivo(comItemNumerado)).toBe(
            "The guide covers the whole market and the practical questions a supplier asks first.\n" +
                "2. The routes to market are three, and they differ by channel and by product category."
        )
    })

    it("quebra o parágrafo quando a página nova começa um parágrafo", () => {
        const atravessaPagina: LinhaDoEstudo[] = [
            linha("1. Scope", TITULO, 0, 1),
            linha("Primeiro parágrafo que termina curto.", CORPO, 21.5, 1),
            linha("Segundo parágrafo começa na página seguinte e segue por duas linhas inteiras do estudo.", CORPO, 0, 2),
            linha("E continua aqui na mesma coluna do documento.", CORPO, 14, 2),
            linha("2. Market Volume", TITULO, 30, 2),
        ]

        expect(extrairResumoExecutivo(atravessaPagina)?.split("\n\n")).toHaveLength(2)
    })

    it("não quebra o parágrafo que continua na página seguinte", () => {
        const continuaNaPagina: LinhaDoEstudo[] = [
            linha("1. Scope", TITULO, 0, 1),
            linha("O parágrafo continua na página seguinte e por isso a última linha daqui vai cheia, sem", CORPO, 21.5, 1),
            linha("ponto final e sem espaço sobrando na coluna do documento.", CORPO, 0, 2),
            linha("2. Market Volume", TITULO, 30, 2),
        ]

        expect(extrairResumoExecutivo(continuaNaPagina)?.split("\n\n")).toHaveLength(1)
    })

    it("devolve null quando não há primeira seção identificável", () => {
        expect(extrairResumoExecutivo([])).toBeNull()
        expect(
            extrairResumoExecutivo([linha("Um texto solto, sem título de seção nenhum.", CORPO, 0, 1)])
        ).toBeNull()
    })

    it("devolve null quando a seção encontrada não tem texto", () => {
        expect(
            extrairResumoExecutivo([
                linha("1. Executive Summary", TITULO, 0, 1),
                linha("2. Market Volume", TITULO, 30, 1),
            ])
        ).toBeNull()
    })
})
