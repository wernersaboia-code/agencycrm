import { describe, it, expect } from "vitest"
import { BLOG_LOCALES } from "./locales"
import { getBlogLabels } from "./i18n"

describe("blog labels", () => {
    it("retorna rótulos para todos os 8 locales sem chaves vazias", () => {
        for (const locale of BLOG_LOCALES) {
            const labels = getBlogLabels(locale)
            expect(labels.readMore.length).toBeGreaterThan(0)
            expect(labels.publishedOn.length).toBeGreaterThan(0)
            expect(labels.allCategories.length).toBeGreaterThan(0)
            expect(Object.keys(labels.localeName)).toHaveLength(8)
        }
    })
    it("nomeia idiomas no próprio locale", () => {
        expect(getBlogLabels("pt").localeName.de).toBe("Alemão")
        expect(getBlogLabels("de").localeName.de).toBe("Deutsch")
    })
})
