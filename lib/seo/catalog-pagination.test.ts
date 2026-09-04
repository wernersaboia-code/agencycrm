import { describe, it, expect } from "vitest"
import { paginaSemFiltro } from "./catalog-pagination"

describe("paginaSemFiltro", () => {
    it("listagem limpa é sempre página 1", () => {
        expect(paginaSemFiltro({})).toBe(1)
        expect(paginaSemFiltro({ page: "1" })).toBe(1)
    })

    it("devolve a página quando não há filtro — é ela que ganha canonical próprio", () => {
        expect(paginaSemFiltro({ page: "2" })).toBe(2)
        expect(paginaSemFiltro({ page: "7" })).toBe(7)
    })

    it("qualquer filtro colapsa em 1, mesmo com page alto", () => {
        // Faceta profunda continua canonizando para /catalog: indexar
        // ?industries=horeca&page=3 seria a explosão combinatória de volta.
        expect(paginaSemFiltro({ industries: "horeca", page: "3" })).toBe(1)
        expect(paginaSemFiltro({ countries: "DE", page: "2" })).toBe(1)
        expect(paginaSemFiltro({ languages: "en", page: "5" })).toBe(1)
        expect(paginaSemFiltro({ search: "alemanha", page: "4" })).toBe(1)
    })

    it("ignora page inválido em vez de gerar canonical quebrado", () => {
        expect(paginaSemFiltro({ page: "0" })).toBe(1)
        expect(paginaSemFiltro({ page: "-3" })).toBe(1)
        expect(paginaSemFiltro({ page: "abc" })).toBe(1)
        expect(paginaSemFiltro({ page: "" })).toBe(1)
        expect(paginaSemFiltro({ page: "2.9" })).toBe(2)
    })
})
