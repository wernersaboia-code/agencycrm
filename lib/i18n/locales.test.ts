import { describe, expect, it } from "vitest"
import {
    LOCALES,
    DEFAULT_LOCALE,
    isLocale,
    isRtlLocale,
    dirForLocale,
    htmlLangFor,
} from "./locales"

describe("locales", () => {
    it("declara os 8 idiomas do projeto, com pt primeiro", () => {
        expect(LOCALES).toEqual(["pt", "de", "en", "es", "fr", "ar", "it", "nl"])
        expect(DEFAULT_LOCALE).toBe("pt")
    })

    it("reconhece locale válido e rejeita desconhecido", () => {
        expect(isLocale("ar")).toBe(true)
        expect(isLocale("pt-BR")).toBe(false)
        expect(isLocale("")).toBe(false)
    })

    it("marca apenas o árabe como RTL", () => {
        expect(isRtlLocale("ar")).toBe(true)
        expect(dirForLocale("ar")).toBe("rtl")
        for (const l of LOCALES.filter((x) => x !== "ar")) {
            expect(dirForLocale(l)).toBe("ltr")
        }
    })

    it("devolve tag BCP 47 com região para Intl", () => {
        expect(htmlLangFor("pt")).toBe("pt-BR")
        expect(htmlLangFor("de")).toBe("de-DE")
        expect(htmlLangFor("ar")).toBe("ar")
    })
})
