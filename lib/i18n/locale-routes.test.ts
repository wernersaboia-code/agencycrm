import { describe, it, expect } from "vitest"
import { localeTargetPath } from "./locale-routes"

describe("localeTargetPath", () => {
    it("mapeia as landings que têm par entre idiomas", () => {
        expect(localeTargetPath("/", "de")).toBe("/de")
        expect(localeTargetPath("/faq", "de")).toBe("/de/faq")
        expect(localeTargetPath("/de", "pt")).toBe("/")
        expect(localeTargetPath("/de/faq", "pt")).toBe("/faq")
    })

    it("mantém o usuário na mesma rota no funil compartilhado", () => {
        // O bug anterior jogava qualquer uma destas na home do outro idioma,
        // fazendo o usuário perder o lugar no meio da compra.
        for (const path of ["/catalog", "/cart", "/checkout", "/list/leads-de", "/my-purchases"]) {
            expect(localeTargetPath(path, "de")).toBe(path)
            expect(localeTargetPath(path, "pt")).toBe(path)
        }
    })

    it("preserva a query implícita ao não reescrever o pathname", () => {
        expect(localeTargetPath("/catalog", "de")).toBe("/catalog")
    })

    it("volta para a home quando a rota /de não tem par em PT", () => {
        expect(localeTargetPath("/de/algo-so-em-alemao", "pt")).toBe("/")
    })
})
