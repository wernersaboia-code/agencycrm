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

    it("não corta o diretório na empresa numerada com o número do capítulo seguinte", () => {
        // Estudos de DIY (Alemanha, França, Polônia): o diretório é o capítulo 9
        // e as empresas também são numeradas, então "10. Dehner" não é o capítulo 10.
        const estudo = [
            "9. Directory of Importers, Buying Offices and Distribution Partners.......... 12",
            "10. Important Legal Notice on the Use of Contact Data......................... 15",
            "9. Directory of Importers, Buying Offices and Distribution Partners",
            "1. OBI (OBI Home and Garden",
            "Website: www.obi.de",
            "10. Dehner (Dehner Holding",
            "Website: www.dehner.de",
            "11. Hagebau",
            "Website: www.hagebau.de",
            "10. Important Legal Notice on the Use of Contact Data",
            "Source: www.notcounted.com",
        ]
        expect(contarEmpresas(estudo)?.empresas).toEqual(["dehner", "hagebau", "obi"])
    })

    it("acha o capítulo seguinte de título curto pelo sumário", () => {
        const estudo = [
            "8. Directory of Importers........................................ 9",
            "9. Sources......................................................... 20",
            "8. Directory of Importers",
            "9. Espace Émeraude www.emeraude.fr",
            "9. Sources",
            "www.notcounted.com",
        ]
        expect(contarEmpresas(estudo)?.empresas).toEqual(["emeraude"])
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
