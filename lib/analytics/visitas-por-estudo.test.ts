// lib/analytics/visitas-por-estudo.test.ts
import { describe, it, expect } from "vitest"

import {
    agruparPorEstudo,
    estudoDaPagina,
    filtroDePaginasDeEstudo,
    filtroDoEstudo,
} from "./visitas-por-estudo"

describe("estudoDaPagina", () => {
    it("reconhece o endereço em português, sem prefixo de idioma", () => {
        expect(estudoDaPagina("/list/toy-market-germany")).toEqual({ slug: "toy-market-germany", idioma: "pt" })
    })

    it("reconhece o endereço com prefixo de idioma", () => {
        expect(estudoDaPagina("/de/list/toy-market-germany")).toEqual({ slug: "toy-market-germany", idioma: "de" })
        expect(estudoDaPagina("/ar/list/plant-based-alternatives-germany")?.idioma).toBe("ar")
    })

    it("ignora o que não é página de estudo", () => {
        expect(estudoDaPagina("/de/catalog")).toBeNull()
        expect(estudoDaPagina("/super-admin/marketplace/lists/abc")).toBeNull()
        expect(estudoDaPagina("/de/list")).toBeNull()
        expect(estudoDaPagina("/xx/list/toy-market-germany")).toBeNull()
        expect(estudoDaPagina("/list/toy-market-germany/extra")).toBeNull()
    })
})

describe("agruparPorEstudo", () => {
    it("soma os idiomas do mesmo estudo e ordena pelo mais visto", () => {
        const grupos = agruparPorEstudo([
            { label: "/de/list/toy-market-germany", pageviews: 6, visitors: 4 },
            { label: "/de/catalog", pageviews: 74, visitors: 16 },
            { label: "/en/list/toy-market-germany", pageviews: 1, visitors: 1 },
            { label: "/list/baby-and-toddler-products-belgium", pageviews: 3, visitors: 2 },
            { label: "/de/list/baby-and-toddler-products-belgium", pageviews: 6, visitors: 2 },
        ])

        expect(grupos).toEqual([
            { slug: "baby-and-toddler-products-belgium", pageviews: 9, visitors: 4, porIdioma: { pt: 3, de: 6 } },
            { slug: "toy-market-germany", pageviews: 7, visitors: 5, porIdioma: { de: 6, en: 1 } },
        ])
    })
})

describe("filtros da API", () => {
    it("filtra um estudo em todos os idiomas", () => {
        const filtro = filtroDoEstudo("toy-market-germany")
        expect(filtro).toContain("requestPath eq '/list/toy-market-germany'")
        expect(filtro).toContain("requestPath eq '/de/list/toy-market-germany'")
        expect(filtro.startsWith("(") && filtro.endsWith(")")).toBe(true)
    })

    it("escapa aspas simples no slug", () => {
        expect(filtroDoEstudo("o'brien")).toContain("'/list/o''brien'")
    })

    it("filtra as páginas de qualquer estudo", () => {
        expect(filtroDePaginasDeEstudo()).toContain("startswith(requestPath, '/de/list/')")
        expect(filtroDePaginasDeEstudo()).toContain("startswith(requestPath, '/list/')")
    })
})
