import { describe, it, expect } from "vitest"
import { localeFromUserLanguage } from "./user-locale"

describe("localeFromUserLanguage", () => {
    it("aceita o locale simples", () => {
        expect(localeFromUserLanguage("de")).toBe("de")
        expect(localeFromUserLanguage("nl")).toBe("nl")
    })

    it("reduz a tag BCP 47 ao locale", () => {
        // A coluna nasceu com "pt-BR" e existem linhas antigas assim. Ler
        // "de-DE" como "de" e o que impede o e-mail de cair no padrao por
        // causa do formato do valor.
        expect(localeFromUserLanguage("pt-BR")).toBe("pt")
        expect(localeFromUserLanguage("de-DE")).toBe("de")
    })

    it("ignora caixa", () => {
        expect(localeFromUserLanguage("DE")).toBe("de")
    })

    it("cai no padrao quando nao ha valor", () => {
        expect(localeFromUserLanguage(null)).toBe("pt")
        expect(localeFromUserLanguage(undefined)).toBe("pt")
        expect(localeFromUserLanguage("")).toBe("pt")
    })

    it("cai no padrao quando o valor nao e um locale nosso", () => {
        expect(localeFromUserLanguage("xx")).toBe("pt")
        expect(localeFromUserLanguage("klingon")).toBe("pt")
    })

    it("aceita o arabe agora que tem traducao propria", () => {
        // Ate a fase 4 da expansao de idiomas, "ar" era roteavel mas nao
        // publicado e caia aqui no padrao. Com messages/ar.json no ar, o
        // locale resolve para si mesmo como qualquer outro publicado.
        expect(localeFromUserLanguage("ar")).toBe("ar")
    })
})
