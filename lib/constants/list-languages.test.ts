import { describe, it, expect } from "vitest"
import { visibleFacets } from "@/lib/constants/catalog-facets"
import { LIST_LANGUAGES, LIST_LANGUAGE_CODES, getListLanguage } from "./list-languages"

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

describe("LIST_LANGUAGE_CODES", () => {
    it("expõe os códigos na mesma ordem de LIST_LANGUAGES", () => {
        expect(LIST_LANGUAGE_CODES).toEqual(LIST_LANGUAGES.map((l) => l.code))
    })

    it("serve de vocabulário para visibleFacets", () => {
        // Só idioma com lista publicada entra no filtro, igual às outras facetas.
        expect(visibleFacets(LIST_LANGUAGE_CODES, { pt: 2, en: 17 }, [])).toEqual(["pt", "en"])
    })
})
