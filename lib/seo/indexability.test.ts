import { describe, it, expect } from "vitest"
import { isPublishedLocale, robotsForLocale, ROBOTS_NAO_ENCONTRADO } from "./indexability"

describe("isPublishedLocale", () => {
    it("aceita os locales com tradução própria", () => {
        for (const locale of ["pt", "de", "en", "es", "fr", "ar", "it", "nl"]) {
            expect(isPublishedLocale(locale)).toBe(true)
        }
    })

    it("recusa valor desconhecido", () => {
        // Desde a fase 4 (messages/ar.json), LOCALES === PUBLISHED_LOCALES —
        // não sobra locale roteável sem tradução para testar aqui. Só um
        // valor que não é locale nenhum exercita o "false".
        expect(isPublishedLocale("xx")).toBe(false)
    })
})

describe("robotsForLocale", () => {
    it("bloqueia indexação de locale desconhecido, mas segue os links", () => {
        expect(robotsForLocale("xx")).toEqual({ index: false, follow: true })
    })

    it("libera indexação de locale publicado", () => {
        expect(robotsForLocale("pt")).toEqual({ index: true, follow: true })
        expect(robotsForLocale("ar")).toEqual({ index: true, follow: true })
    })
})

describe("ROBOTS_NAO_ENCONTRADO", () => {
    it("bloqueia indexação mas segue os links de volta ao catálogo", () => {
        expect(ROBOTS_NAO_ENCONTRADO).toEqual({ index: false, follow: true })
    })
})
