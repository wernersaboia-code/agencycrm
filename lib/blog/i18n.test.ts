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
            expect(labels.previous.length).toBeGreaterThan(0)
            expect(labels.next.length).toBeGreaterThan(0)
            expect(labels.pageOf).toContain("{current}")
            expect(labels.pageOf).toContain("{total}")
            expect(Object.keys(labels.localeName)).toHaveLength(8)
            // O layout acrescenta " | Easy Prospect" (16 caracteres) ao título.
            expect(labels.metaTitle.length).toBeGreaterThan(0)
            expect(labels.metaTitle.length).toBeLessThanOrEqual(50)
            expect(labels.metaDescription.length).toBeGreaterThanOrEqual(100)
            expect(labels.metaDescription.length).toBeLessThanOrEqual(160)
        }
    })
    it("nomeia idiomas no próprio locale", () => {
        expect(getBlogLabels("pt").localeName.de).toBe("Alemão")
        expect(getBlogLabels("de").localeName.de).toBe("Deutsch")
    })
})
