import { describe, expect, it } from "vitest"
import {
    LOCALES,
    DEFAULT_LOCALE,
    PUBLISHED_LOCALES,
    isLocale,
    isRtlLocale,
    dirForLocale,
    htmlLangFor,
    ogLocaleFor,
    resolveMessagesLocale,
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

    it("devolve locale de Open Graph com sublinhado, não hífen", () => {
        expect(ogLocaleFor("pt")).toBe("pt_BR")
        expect(ogLocaleFor("en")).toBe("en_US")
    })

    it("publica pt, de, en, es e fr — os que têm messages/ próprio", () => {
        expect(PUBLISHED_LOCALES).toEqual(["pt", "de", "en", "es", "fr"])
    })
})

describe("resolveMessagesLocale", () => {
    it("serve o próprio locale quando ele é publicado", () => {
        expect(resolveMessagesLocale("de")).toBe("de")
        expect(resolveMessagesLocale("en")).toBe("en")
    })

    // O bug que esta função substitui: a ternária antiga em i18n/request.ts
    // só conhecia "de" — todo locale não-alemão, publicado ou não, caía em
    // pt. "en" ficaria preso nesse fallback para sempre, mesmo depois de
    // messages/en.json existir, até alguém lembrar de crescer a ternária.
    it("cai no padrão quando o locale não tem tradução própria", () => {
        expect(resolveMessagesLocale("it")).toBe("pt")
        expect(resolveMessagesLocale("nl")).toBe("pt")
        expect(resolveMessagesLocale("ar")).toBe("pt")
    })

    it("aceita lista de publicados e padrão customizados", () => {
        expect(resolveMessagesLocale("de", ["de"], "en")).toBe("de")
        expect(resolveMessagesLocale("fr", ["de"], "en")).toBe("en")
    })
})
