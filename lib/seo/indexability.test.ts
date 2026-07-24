import { describe, it, expect } from "vitest"
import { isPublishedLocale, robotsForLocale } from "./indexability"

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
