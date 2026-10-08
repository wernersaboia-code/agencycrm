import { describe, expect, it } from "vitest"
import { contarEmpresas, juntarVariantes, linhasDoDiretorio } from "./contagem-empresas"

// Trechos reais do corpus, encurtados: o sumário cita o diretório, o capítulo
// vem depois, e o capítulo seguinte só FALA do diretório.
const ESTUDO = [
    "Table of Contents",
    "9.  Directory of relevant importers and distributors........................ 12",
    "10. How to read the directory (classification key)......................... 20",
    "1. Executive Summary",
    "Visit www.destatis.de for statistics.",
    "9.  Directory of relevant importers and distributors",
    "Hexagon Im- und Export GmbH & Co. KG",
    "Contact mail@hexagontradinggroup.com Tel. +49 421 178970 www.hexagontradinggroup.com",
    "ASKO Norge AS Web: asko.no",
    "Dangaard www.dangaard.com — Danish entity www.dangaard.dk",
    "Fleggaard www.fleggaard.dk, holding: www.fleggaard-holding.dk",
    "Buyer: serdar.tansug",
    "@yayla.de",
    "See also europages.de and the e.g. trade register; ministry: www.mof.gov.uk",
    "Bidfood Türkiye bidfood.com.tr",
    "10. How to read the directory (classification key)",
    "Other site: www.notcounted.com",
]

describe("linhasDoDiretorio", () => {
    it("pula o sumário e o capítulo que só menciona o diretório", () => {
        const trecho = linhasDoDiretorio(ESTUDO)!
        expect(trecho[0]).toBe("9.  Directory of relevant importers and distributors")
        expect(trecho.at(-1)).toBe("Bidfood Türkiye bidfood.com.tr")
    })

    it("reconhece o título em português", () => {
        const pt = ["10. Lista de contatos e referências", "Importadora www.frutas.de", "11. Fim"]
        expect(contarEmpresas(pt)?.empresas).toEqual(["frutas"])
    })

    it("devolve null quando o estudo não tem diretório", () => {
        expect(linhasDoDiretorio(["1. Executive Summary", "2. Market size"])).toBeNull()
    })
})

describe("contarEmpresas", () => {
    it("conta empresas distintas pelo site e pelo e-mail, só dentro do diretório", () => {
        expect(contarEmpresas(ESTUDO)?.empresas).toEqual([
            "asko",
            "bidfood",
            "dangaard",
            "fleggaard",
            "hexagontradinggroup",
            "yayla",
        ])
    })

    it("não conta local part de e-mail quebrado, portal, prosa nem governo", () => {
        const nomes = contarEmpresas(ESTUDO)!.empresas
        expect(nomes).not.toContain("serdar")
        expect(nomes).not.toContain("europages")
        expect(nomes).not.toContain("mof")
        expect(nomes).not.toContain("destatis")
        expect(nomes).not.toContain("notcounted")
    })
})

describe("juntarVariantes", () => {
    it("junta o mesmo nome com sufixo ou sem hífen", () => {
        expect(juntarVariantes(["transfood-grosshandel", "transfoodgrosshandel", "fleggaard", "fleggaard-holding"]))
            .toEqual(["fleggaard", "transfood-grosshandel"])
    })

    it("não engole nomes curtos que só começam igual", () => {
        expect(juntarVariantes(["bio", "biogros"])).toEqual(["bio", "biogros"])
    })
})
