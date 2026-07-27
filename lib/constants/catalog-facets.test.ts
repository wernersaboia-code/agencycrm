import { describe, it, expect } from "vitest"
import { CATEGORY_IDS, INDUSTRY_IDS, visibleFacets } from "./catalog-facets"

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
        expect(new Set(CATEGORY_IDS).size).toBe(CATEGORY_IDS.length)
        expect(new Set(INDUSTRY_IDS).size).toBe(INDUSTRY_IDS.length)
    })

    it("tem rótulo em português para todo id", async () => {
        const messages = (await import("../../messages/pt.json")).default

        for (const id of CATEGORY_IDS) {
            expect(messages.catalog.categories).toHaveProperty(id)
        }
        for (const id of INDUSTRY_IDS) {
            expect(messages.catalog.industries).toHaveProperty(id)
        }
    })
})
