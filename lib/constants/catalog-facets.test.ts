import { describe, it, expect } from "vitest"
import { idiomaOfereceEscolha, secaoOfereceEscolha, visibleFacets } from "./catalog-facets"

describe("visibleFacets", () => {
    it("mostra só as facetas com lista publicada por trás", () => {
        expect(visibleFacets(["food", "tech", "retail"], { food: 3, tech: 0 }, [])).toEqual([
            "food",
        ])
    })

    it("mantém visível a faceta selecionada mesmo zerada", () => {
        // Filtro vindo de link antigo: se sumisse, ficaria ativo sem ter como
        // ser desmarcado.
        expect(visibleFacets(["food", "tech"], { food: 3 }, ["tech"])).toEqual(["food", "tech"])
    })

    it("preserva a ordem do vocabulário", () => {
        expect(
            visibleFacets(["food", "tech", "retail"], { retail: 1, food: 2, tech: 1 }, [])
        ).toEqual(["food", "tech", "retail"])
    })

    it("devolve vazio quando nenhuma faceta tem contagem", () => {
        expect(visibleFacets(["food", "tech"], {}, [])).toEqual([])
    })
})

describe("secaoOfereceEscolha", () => {
    it("esconde a seção com uma faceta só", () => {
        expect(secaoOfereceEscolha(["importers"], [])).toBe(false)
    })

    it("mostra a seção com duas ou mais", () => {
        expect(secaoOfereceEscolha(["importers", "exporters"], [])).toBe(true)
    })

    it("esconde a seção vazia", () => {
        expect(secaoOfereceEscolha([], [])).toBe(false)
    })

    it("mostra a seção com faceta única SE houver filtro ativo nela", () => {
        // Link antigo com ?category=importers: sem esta exceção o filtro ficaria
        // aplicado e invisível, sem como desmarcar.
        expect(secaoOfereceEscolha(["importers"], ["importers"])).toBe(true)
    })
})

describe("idiomaOfereceEscolha", () => {
    it("esconde o filtro quando só um idioma tem volume", () => {
        // O catálogo de 10.11.2026.
        expect(idiomaOfereceEscolha({ en: 162, pt: 1, es: 1 }, [])).toBe(false)
        expect(idiomaOfereceEscolha({ en: 162 }, [])).toBe(false)
        expect(idiomaOfereceEscolha({}, [])).toBe(false)
    })

    it("mostra quando dois idiomas têm estudos suficientes", () => {
        expect(idiomaOfereceEscolha({ en: 162, de: 5, pt: 1 }, [])).toBe(true)
        expect(idiomaOfereceEscolha({ en: 162, de: 4 }, [])).toBe(false)
    })

    it("filtro já ativo mantém a seção, para poder ser desmarcado", () => {
        expect(idiomaOfereceEscolha({ en: 162, pt: 1 }, ["pt"])).toBe(true)
    })
})
