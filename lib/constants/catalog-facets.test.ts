import { describe, it, expect } from "vitest"
import { INDUSTRY_IDS, secaoOfereceEscolha, visibleFacets } from "./catalog-facets"

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

describe("vocabulário controlado", () => {
    it("não tem id repetido", () => {
        expect(new Set(INDUSTRY_IDS).size).toBe(INDUSTRY_IDS.length)
    })

    it("tem rótulo em português para todo id", async () => {
        const messages = (await import("../../messages/pt.json")).default

        for (const id of INDUSTRY_IDS) {
            expect(messages.catalog.industries).toHaveProperty(id)
        }
    })

    // A busca tem duas dimensões e só duas. Um setor genérico voltando ao
    // vocabulário (tech, fashion, retail…) é regressão: nenhum estudo usa.
    // `snacks_bars` é a linha "Fruit Bars and Cereal Bars" e `toys` a linha
    // "Toy Market" — cada id aqui tem estudo com esse título por trás.
    it("só tem os setores que aparecem no título dos estudos", () => {
        expect([...INDUSTRY_IDS]).toEqual([
            "exotic_fruits",
            "fmcg",
            "horeca",
            "snacks_bars",
            "toys",
        ])
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
