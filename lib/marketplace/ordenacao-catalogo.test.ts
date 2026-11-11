import { describe, it, expect } from "vitest"
import { lerOrdenacao, ordenaPorNome, ordenarPorNome, type ItemOrdenavel } from "./ordenacao-catalogo"

const PAISES: Record<string, Record<string, string>> = {
    pt: { DE: "Alemanha", FR: "França", AT: "Áustria", NO: "Noruega" },
    en: { DE: "Germany", FR: "France", AT: "Austria", NO: "Norway" },
}
const SETORES: Record<string, string> = { toys: "Brinquedos", fmcg: "FMCG", fashion: "Moda" }

const nomes = (locale: string) => ({
    pais: (codigo: string) => PAISES[locale][codigo] ?? codigo,
    setor: (id: string) => SETORES[id] ?? id,
})

function item(id: string, countries: string[], industries: string[], dia = 1): ItemOrdenavel {
    return { id, countries, industries, createdAt: new Date(Date.UTC(2026, 9, dia)) }
}

const ids = (itens: ItemOrdenavel[]) => itens.map((i) => i.id)

describe("lerOrdenacao", () => {
    it("aceita os valores conhecidos", () => {
        expect(lerOrdenacao("recent")).toBe("recent")
        expect(lerOrdenacao("country")).toBe("country")
        expect(lerOrdenacao("industry")).toBe("industry")
    })

    it("cai no padrão para ausente ou desconhecido", () => {
        expect(lerOrdenacao(undefined)).toBe("featured")
        expect(lerOrdenacao("")).toBe("featured")
        expect(lerOrdenacao("price")).toBe("featured")
    })
})

describe("ordenaPorNome", () => {
    it("só país e setor são ordenados em memória", () => {
        expect(ordenaPorNome("country")).toBe(true)
        expect(ordenaPorNome("industry")).toBe(true)
        expect(ordenaPorNome("featured")).toBe(false)
        expect(ordenaPorNome("recent")).toBe(false)
    })
})

describe("ordenarPorNome", () => {
    const catalogo = [
        item("fr-moda", ["FR"], ["fashion"]),
        item("de-fmcg", ["DE"], ["fmcg"]),
        item("at-moda", ["AT"], ["fashion"]),
        item("de-brinq", ["DE"], ["toys"]),
    ]

    it("por país usa o nome no idioma do visitante", () => {
        // Em pt a Áustria vem depois da Alemanha (acento não conta); em en,
        // Austria vem antes de Germany.
        expect(ids(ordenarPorNome(catalogo, "country", nomes("pt"), "pt"))).toEqual([
            "de-brinq",
            "de-fmcg",
            "at-moda",
            "fr-moda",
        ])
        expect(ids(ordenarPorNome(catalogo, "country", nomes("en"), "en"))).toEqual([
            "at-moda",
            "fr-moda",
            "de-brinq",
            "de-fmcg",
        ])
    })

    it("por setor desempata pelo país", () => {
        expect(ids(ordenarPorNome(catalogo, "industry", nomes("pt"), "pt"))).toEqual([
            "de-brinq",
            "de-fmcg",
            "at-moda",
            "fr-moda",
        ])
    })

    it("mesmo país e setor: o mais recente primeiro", () => {
        const dois = [item("velho", ["DE"], ["fmcg"], 1), item("novo", ["DE"], ["fmcg"], 20)]
        expect(ids(ordenarPorNome(dois, "country", nomes("pt"), "pt"))).toEqual(["novo", "velho"])
    })

    it("vale o primeiro país da lista, o da primeira bandeira do cartão", () => {
        const multi = [item("no-de", ["NO", "DE"], ["fmcg"]), item("fr", ["FR"], ["fmcg"])]
        expect(ids(ordenarPorNome(multi, "country", nomes("pt"), "pt"))).toEqual(["fr", "no-de"])
    })

    it("o setor do estudo não depende da ordem em que foi marcado", () => {
        const a = [item("x", ["DE"], ["fashion", "toys"]), item("y", ["DE"], ["fmcg"])]
        expect(ids(ordenarPorNome(a, "industry", nomes("pt"), "pt"))).toEqual(["x", "y"])
    })

    it("sem país ou sem setor vai para o fim", () => {
        const comBuraco = [item("sem", [], []), item("de", ["DE"], ["fmcg"])]
        expect(ids(ordenarPorNome(comBuraco, "country", nomes("pt"), "pt"))).toEqual(["de", "sem"])
        expect(ids(ordenarPorNome(comBuraco, "industry", nomes("pt"), "pt"))).toEqual(["de", "sem"])
    })

    it("não altera o array recebido", () => {
        const original = [...catalogo]
        ordenarPorNome(catalogo, "country", nomes("pt"), "pt")
        expect(catalogo).toEqual(original)
    })
})
