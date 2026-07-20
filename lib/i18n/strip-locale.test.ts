import { describe, expect, it } from "vitest"
import { stripLocale } from "./strip-locale"

describe("stripLocale", () => {
    it("remove o prefixo de idioma e devolve o locale", () => {
        expect(stripLocale("/de/catalog")).toEqual({ locale: "de", pathname: "/catalog" })
        expect(stripLocale("/ar/blog")).toEqual({ locale: "ar", pathname: "/blog" })
    })

    it("trata a raiz do idioma como caminho raiz", () => {
        expect(stripLocale("/de")).toEqual({ locale: "de", pathname: "/" })
    })

    it("assume o padrão quando não há prefixo", () => {
        expect(stripLocale("/catalog")).toEqual({ locale: "pt", pathname: "/catalog" })
        expect(stripLocale("/")).toEqual({ locale: "pt", pathname: "/" })
    })

    it("não confunde segmento parecido com locale", () => {
        // "/list" começa com "l" mas não é locale; "/it" é.
        expect(stripLocale("/list/abc")).toEqual({ locale: "pt", pathname: "/list/abc" })
        expect(stripLocale("/it/list/abc")).toEqual({ locale: "it", pathname: "/list/abc" })
    })
})
