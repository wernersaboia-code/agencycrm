import { describe, expect, it } from "vitest"
import { alternatesFor } from "./alternates"

describe("alternatesFor", () => {
    it("gera uma entrada por idioma mais x-default", () => {
        const { languages } = alternatesFor("/catalog")
        expect(Object.keys(languages)).toHaveLength(9) // 8 idiomas + x-default
        expect(languages["x-default"]).toMatch(/\/catalog$/)
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
