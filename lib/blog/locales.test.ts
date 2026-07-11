import { describe, it, expect } from "vitest"
import { BLOG_LOCALES, DEFAULT_BLOG_LOCALE, isBlogLocale, isRtlLocale, dirForLocale } from "./locales"

describe("blog locales", () => {
    it("has the 8 supported locales", () => {
        expect(BLOG_LOCALES).toEqual(["pt", "de", "en", "es", "fr", "ar", "it", "nl"])
    })
    it("default is pt", () => {
        expect(DEFAULT_BLOG_LOCALE).toBe("pt")
    })
    it("recognizes valid and invalid locales", () => {
        expect(isBlogLocale("ar")).toBe(true)
        expect(isBlogLocale("xx")).toBe(false)
    })
    it("marks only arabic as RTL", () => {
        expect(isRtlLocale("ar")).toBe(true)
        expect(isRtlLocale("pt")).toBe(false)
        expect(dirForLocale("ar")).toBe("rtl")
        expect(dirForLocale("en")).toBe("ltr")
    })
})
