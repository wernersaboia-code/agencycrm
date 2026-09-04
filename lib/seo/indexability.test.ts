import { describe, it, expect } from "vitest"
import { isPublishedLocale, robotsForLocale, robotsForPath, ROBOTS_NAO_ENCONTRADO } from "./indexability"

describe("isPublishedLocale", () => {
    it("aceita os locales com tradução própria", () => {
        for (const locale of ["pt", "de", "en", "es", "fr", "it", "nl"]) {
            expect(isPublishedLocale(locale)).toBe(true)
        }
    })

    it("recusa locale roteável sem tradução e valor desconhecido", () => {
        expect(isPublishedLocale("ar")).toBe(false)
        expect(isPublishedLocale("xx")).toBe(false)
    })
})

describe("robotsForLocale", () => {
    it("bloqueia indexação de locale não publicado, mas segue os links", () => {
        expect(robotsForLocale("ar")).toEqual({ index: false, follow: true })
    })

    it("libera indexação de locale publicado", () => {
        expect(robotsForLocale("pt")).toEqual({ index: true, follow: true })
    })
})

describe("robotsForPath", () => {
    it("libera a rota legal no idioma que tem o documento", () => {
        expect(robotsForPath("/terms", "de")).toEqual({ index: true, follow: true })
        expect(robotsForPath("/privacy", "pt")).toEqual({ index: true, follow: true })
    })

    it("bloqueia a rota legal no idioma que cai no português", () => {
        // A página abre normalmente para quem chega — o que muda é só o que o
        // buscador faz com ela.
        expect(robotsForPath("/terms", "ar")).toEqual({ index: false, follow: true })
        expect(robotsForPath("/privacy", "ar")).toEqual({ index: false, follow: true })
        expect(robotsForPath("/refund", "ar")).toEqual({ index: false, follow: true })
    })

    it("não restringe rota cujo texto vem de messages/", () => {
        expect(robotsForPath("/catalog", "fr")).toEqual({ index: true, follow: true })
        expect(robotsForPath("/about", "nl")).toEqual({ index: true, follow: true })
    })

    it("continua recusando valor que não é locale", () => {
        expect(robotsForPath("/terms", "xx")).toEqual({ index: false, follow: true })
    })
})

describe("ROBOTS_NAO_ENCONTRADO", () => {
    it("bloqueia indexação mas segue os links de volta ao catálogo", () => {
        expect(ROBOTS_NAO_ENCONTRADO).toEqual({ index: false, follow: true })
    })
})
