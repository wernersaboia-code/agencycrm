import { describe, it, expect } from "vitest"
import { BLOG_PAGE_SIZE, normalizarPagina, totalDePaginas } from "./pagination"

describe("normalizarPagina", () => {
    it("aceita inteiros positivos", () => {
        expect(normalizarPagina("1")).toBe(1)
        expect(normalizarPagina("2")).toBe(2)
    })

    it("cai na primeira página para ausência, lixo ou valor inválido", () => {
        expect(normalizarPagina(undefined)).toBe(1)
        expect(normalizarPagina("")).toBe(1)
        expect(normalizarPagina("abc")).toBe(1)
        expect(normalizarPagina("0")).toBe(1)
        expect(normalizarPagina("-3")).toBe(1)
        expect(normalizarPagina("Infinity")).toBe(1)
    })

    it("trunca frações", () => {
        expect(normalizarPagina("2.9")).toBe(2)
    })
})

describe("totalDePaginas", () => {
    it("arredonda para cima e nunca desce de 1", () => {
        expect(totalDePaginas(0)).toBe(1)
        expect(totalDePaginas(1)).toBe(1)
        expect(totalDePaginas(BLOG_PAGE_SIZE)).toBe(1)
        expect(totalDePaginas(BLOG_PAGE_SIZE + 1)).toBe(2)
        expect(totalDePaginas(BLOG_PAGE_SIZE * 3)).toBe(3)
    })

    it("respeita pageSize customizado e ignora pageSize inválido", () => {
        expect(totalDePaginas(10, 5)).toBe(2)
        expect(totalDePaginas(10, 0)).toBe(Math.ceil(10 / BLOG_PAGE_SIZE))
        expect(totalDePaginas(Number.NaN)).toBe(1)
    })
})
