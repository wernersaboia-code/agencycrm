import { describe, expect, it } from "vitest"
import { alternatesFor, canonicalDefaultLocale } from "./alternates"
import { PUBLISHED_LOCALES } from "./locales"

describe("alternatesFor", () => {
    it("gera uma entrada por idioma publicado mais x-default", () => {
        const { languages } = alternatesFor("/catalog")
        expect(Object.keys(languages)).toHaveLength(PUBLISHED_LOCALES.length + 1)
        expect(languages["x-default"]).toMatch(/\/catalog$/)
    })

    it("anuncia o árabe como qualquer outro locale publicado", () => {
        const { languages } = alternatesFor("/catalog")
        expect(languages["ar"]).toMatch(/\/ar\/catalog$/)
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

    it("árabe canoniza para si mesmo agora que é publicado", () => {
        expect(alternatesFor("/catalog", "ar").canonical).toMatch(/\/ar\/catalog$/)
    })

    // Até a fase 4 da expansão de idiomas, "ar" era o exemplo real de locale
    // roteável mas não publicado, e o teste vivia aqui com ele. Hoje
    // LOCALES === PUBLISHED_LOCALES — não sobra locale de verdade para
    // exercitar esse ramo, e `current` é tipado para não aceitar valor fora
    // de LOCALES. A guarda em alternatesFor (canonicalLocale) fica no código
    // como defesa para o próximo idioma que entrar roteável antes de
    // publicado — só volta a ter cobertura direta quando isso acontecer.

    it("trata a raiz sem barra dupla", () => {
        const { languages } = alternatesFor("/")
        expect(languages["de-DE"]).toMatch(/\/de$/)
        expect(languages["de-DE"]).not.toMatch(/\/\/$/)
    })
})

describe("canonicalDefaultLocale", () => {
    it("aponta sempre para a URL sem prefixo, sem hreflang", () => {
        const result = canonicalDefaultLocale("/list/leads-alemanha")
        expect(result.canonical).toMatch(/\/list\/leads-alemanha$/)
        expect(result.canonical).not.toMatch(/\/(de|es|fr|it|nl|en)\//)
        expect(result).not.toHaveProperty("languages")
    })
})
