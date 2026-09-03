import { describe, it, expect } from "vitest"
import {
    nomeDePais,
    validaCodigoDePais,
    normalizaCodigoDePais,
    paisesInvalidosDoCampo,
    excecoesDoIdioma,
} from "./nome-de-pais"

/**
 * País deixou de ser vocabulário curado: o nome vem do ICU (`Intl.DisplayNames`)
 * e a validação pergunta "é um país de verdade?", não "está na minha lista?".
 *
 * O que torna isso possível é o runtime já traduzir 280 códigos nos sete
 * idiomas — conferido contra a tabela antiga: 371 dos 378 rótulos batiam.
 */
describe("normalizaCodigoDePais", () => {
    it("põe em maiúscula e tira espaço", () => {
        expect(normalizaCodigoDePais("  br ")).toBe("BR")
    })
})

describe("nomeDePais", () => {
    it("traduz o código no idioma pedido", () => {
        expect(nomeDePais("ZA", "pt")).toBe("África do Sul")
        expect(nomeDePais("ZA", "de")).toBe("Südafrika")
    })

    it("aceita o código em minúscula", () => {
        expect(nomeDePais("za", "pt")).toBe("África do Sul")
    })

    it("deixa a exceção do projeto vencer o nome do ICU", () => {
        // O ICU diz "Países Baixos"; o site sempre disse "Holanda".
        expect(nomeDePais("NL", "pt")).toBe("Países Baixos")
        expect(nomeDePais("NL", "pt", { NL: "Holanda" })).toBe("Holanda")
    })

    it("devolve o próprio código quando não sabe traduzir", () => {
        // Nunca quebrar a tela por causa de um código estranho no banco.
        expect(nomeDePais("XX", "pt")).toBe("XX")
    })
})

describe("validaCodigoDePais", () => {
    it("aceita país de qualquer parte do mundo sem precisar de cadastro", () => {
        // O ponto da mudança: publicar estudo de país novo não exige commit.
        for (const code of ["ZA", "VN", "KZ", "FJ", "MN", "BW"]) {
            expect(validaCodigoDePais(code).ok, code).toBe(true)
        }
    })

    it("recusa código que não existe", () => {
        expect(validaCodigoDePais("XX").ok).toBe(false)
    })

    it("recusa o que não tem duas letras", () => {
        expect(validaCodigoDePais("BRA").ok).toBe(false)
        expect(validaCodigoDePais("").ok).toBe(false)
        expect(validaCodigoDePais("B1").ok).toBe(false)
    })

    it("recusa código obsoleto apontando o atual", () => {
        // O ICU resolve estes silenciosamente (UK vira Reino Unido, SU vira
        // Rússia). Aceitá-los criaria DUAS facetas para o mesmo país.
        const uk = validaCodigoDePais("UK")
        expect(uk.ok).toBe(false)
        if (!uk.ok) expect(uk.motivo).toContain("GB")

        const su = validaCodigoDePais("SU")
        expect(su.ok).toBe(false)
        if (!su.ok) expect(su.motivo).toContain("RU")
    })

    it("recusa agrupamento que não é país", () => {
        // EU é a União Europeia, ZZ é "região desconhecida", XA é código de
        // teste do próprio ICU — todos passam pelo Intl sem reclamar.
        for (const code of ["EU", "EZ", "ZZ", "XA", "QO"]) {
            expect(validaCodigoDePais(code).ok, code).toBe(false)
        }
    })

    it("dá um motivo legível para o admin em toda recusa", () => {
        for (const code of ["XX", "BRA", "UK", "EU"]) {
            const r = validaCodigoDePais(code)
            expect(r.ok).toBe(false)
            if (!r.ok) expect(r.motivo.length).toBeGreaterThan(10)
        }
    })
})

/**
 * O campo de país no admin é texto livre e vem auto-preenchido dos leads do PDF
 * importado. É por ali que entram "UK", código de três letras e lixo em geral,
 * então o formulário avisa enquanto a pessoa digita.
 */
describe("paisesInvalidosDoCampo", () => {
    it("não reclama de campo bem preenchido", () => {
        expect(paisesInvalidosDoCampo("DE, AT, CH")).toEqual([])
    })

    it("aponta os códigos ruins, já normalizados", () => {
        expect(paisesInvalidosDoCampo("de, XX")).toEqual([{ code: "XX" }])
    })

    it("diz qual é o código certo quando o antigo tem substituto", () => {
        // O aviso do formulário é o que a pessoa vê primeiro; mandá-la procurar
        // sozinha qual é o código do Reino Unido seria mesquinho.
        expect(paisesInvalidosDoCampo("UK, SU")).toEqual([
            { code: "UK", atual: "GB" },
            { code: "SU", atual: "RU" },
        ])
    })

    it("não reclama enquanto a vírgula está sendo digitada", () => {
        // "DE," é um estado normal de digitação: o pedaço vazio não é erro.
        expect(paisesInvalidosDoCampo("DE,")).toEqual([])
        expect(paisesInvalidosDoCampo("")).toEqual([])
        expect(paisesInvalidosDoCampo("  ")).toEqual([])
    })

    it("não repete o mesmo código ruim", () => {
        expect(paisesInvalidosDoCampo("UK, uk, GB")).toEqual([{ code: "UK", atual: "GB" }])
    })
})

/**
 * As exceções moravam nos arquivos de mensagem e vazavam entre idiomas: o
 * next-intl caía no idioma padrão quando o bloco do idioma estava vazio, e a
 * página em alemão exibia "Holanda" e "República Tcheca". Como são dado de
 * código e não texto de tradutor, passaram a morar aqui.
 */
describe("excecoesDoIdioma", () => {
    it("dá as exceções do próprio idioma", () => {
        expect(excecoesDoIdioma("pt")).toEqual({ CZ: "República Tcheca", NL: "Holanda" })
    })

    it("não vaza exceção de um idioma para outro", () => {
        // O alemão concorda com o ICU em tudo: nenhuma exceção, e nunca as do pt.
        expect(excecoesDoIdioma("de")).toEqual({})
        expect(nomeDePais("NL", "de", excecoesDoIdioma("de"))).toBe("Niederlande")
        expect(nomeDePais("CZ", "de", excecoesDoIdioma("de"))).toBe("Tschechien")
    })

    it("dá objeto vazio para idioma desconhecido", () => {
        expect(excecoesDoIdioma("ja")).toEqual({})
    })

    it("mantém os nomes que o site sempre usou", () => {
        expect(nomeDePais("NL", "pt", excecoesDoIdioma("pt"))).toBe("Holanda")
        expect(nomeDePais("TR", "en", excecoesDoIdioma("en"))).toBe("Turkey")
    })
})
