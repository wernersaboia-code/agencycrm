import { describe, it, expect } from "vitest"
import { localesComConteudo, temConteudoNoLocale } from "./content-coverage"
import { PUBLISHED_LOCALES } from "@/lib/i18n/locales"

describe("localesComConteudo", () => {
    it("rota que tira o texto de messages/ vale em todos os publicados", () => {
        expect(localesComConteudo("/catalog")).toEqual(PUBLISHED_LOCALES)
        expect(localesComConteudo("/faq")).toEqual(PUBLISHED_LOCALES)
        expect(localesComConteudo("/about")).toEqual(PUBLISHED_LOCALES)
    })

    it("rota legal vale só onde existe o documento", () => {
        for (const path of ["/terms", "/privacy", "/refund"]) {
            const cobertura = localesComConteudo(path)

            expect(cobertura).toContain("pt")
            expect(cobertura).toContain("de")
            // content/legal ainda não tem documento árabe; a página abre com o
            // português do fallback, mas não é uma variante de idioma.
            expect(cobertura).not.toContain("ar")
        }
    })

    it("preserva a ordem de PUBLISHED_LOCALES, para o hreflang sair estável", () => {
        const cobertura = localesComConteudo("/terms")
        const esperado = PUBLISHED_LOCALES.filter((l) => l !== "ar")

        expect(cobertura).toEqual(esperado)
    })
})

describe("temConteudoNoLocale", () => {
    it("separa idioma com documento de idioma que cai no fallback", () => {
        expect(temConteudoNoLocale("/terms", "de")).toBe(true)
        expect(temConteudoNoLocale("/terms", "ar")).toBe(false)
    })

    it("não restringe rota fora do mapa", () => {
        expect(temConteudoNoLocale("/catalog", "ar")).toBe(true)
        expect(temConteudoNoLocale("/", "ar")).toBe(true)
    })
})
