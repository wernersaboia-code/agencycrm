import { describe, expect, it } from "vitest"
import { alternatesFor } from "./alternates"
import { PUBLISHED_LOCALES } from "./locales"

describe("alternatesFor", () => {
    it("gera uma entrada por idioma publicado mais x-default", () => {
        const { languages } = alternatesFor("/catalog")
        expect(Object.keys(languages)).toHaveLength(PUBLISHED_LOCALES.length + 1)
        expect(languages["x-default"]).toMatch(/\/catalog$/)
    })

    it("não anuncia locale roteável mas não publicado (ex.: ar)", () => {
        const { languages } = alternatesFor("/catalog")
        expect(languages["ar"]).toBeUndefined()
    })

    it("não prefixa o idioma padrão", () => {
        const { languages } = alternatesFor("/catalog")
        expect(languages["pt-BR"]).toMatch(/\/catalog$/)
        expect(languages["pt-BR"]).not.toMatch(/\/pt\//)
        expect(languages["de-DE"]).toMatch(/\/de\/catalog$/)
    })

    it("canonical aponta para o próprio idioma", () => {
        expect(alternatesFor("/catalog", "de").canonical).toMatch(/\/de\/catalog$/)
        expect(alternatesFor("/catalog", "pt").canonical).toMatch(/\/catalog$/)
    })

    it("trata a raiz sem barra dupla", () => {
        const { languages } = alternatesFor("/")
        expect(languages["de-DE"]).toMatch(/\/de$/)
        expect(languages["de-DE"]).not.toMatch(/\/\/$/)
    })
})
