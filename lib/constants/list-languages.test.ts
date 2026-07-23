import { describe, it, expect } from "vitest"
import { LIST_LANGUAGES, getListLanguage } from "./list-languages"

describe("list-languages", () => {
    it("tem as 7 línguas do app", () => {
        expect(LIST_LANGUAGES.map((l) => l.code)).toEqual([
            "pt", "en", "de", "fr", "es", "it", "nl",
        ])
    })

    it("mapeia português para a bandeira do Brasil", () => {
        expect(getListLanguage("pt")).toEqual({ code: "pt", label: "Português", flagCode: "br" })
    })

    it("mapeia inglês para a bandeira do Reino Unido", () => {
        expect(getListLanguage("en")?.flagCode).toBe("gb")
    })

    it("retorna null para código desconhecido ou vazio", () => {
        expect(getListLanguage("xx")).toBeNull()
        expect(getListLanguage(null)).toBeNull()
        expect(getListLanguage(undefined)).toBeNull()
    })
})
