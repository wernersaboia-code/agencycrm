import { describe, it, expect } from "vitest"
import { COUNTRY_CODES, INDUSTRY_IDS, secaoOfereceEscolha, visibleFacets } from "./catalog-facets"

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
        expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length)
    })

    it("tem rótulo em português para todo id", async () => {
        const messages = (await import("../../messages/pt.json")).default

        for (const id of INDUSTRY_IDS) {
            expect(messages.catalog.industries).toHaveProperty(id)
        }
        for (const code of COUNTRY_CODES) {
            expect(messages.catalog.countries).toHaveProperty(code)
        }
    })

    // A busca tem duas dimensões e só duas. Um setor genérico voltando ao
    // vocabulário (tech, fashion, retail…) é regressão: nenhum estudo usa.
    it("só tem os setores que aparecem no título dos estudos", () => {
        expect([...INDUSTRY_IDS]).toEqual(["exotic_fruits", "fmcg", "horeca"])
    })

    // O catálogo grava GB; "UK" não é código ISO 3166-1 e quebra a bandeira.
    it("usa GB, não UK", () => {
        expect(COUNTRY_CODES).toContain("GB")
        expect(COUNTRY_CODES).not.toContain("UK")
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
