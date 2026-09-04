import { describe, expect, it } from "vitest"
import { alternatesFor } from "./alternates"
import { PUBLISHED_LOCALES } from "./locales"

/** `/catalog` tira o texto de messages/ e vale em todos os idiomas publicados. */
function languagesDe(
    ...args: Parameters<typeof alternatesFor>
): Record<string, string> {
    const { languages } = alternatesFor(...args)
    if (!languages) throw new Error(`esperava hreflang para ${args[0]}`)
    return languages
}

describe("alternatesFor", () => {
    it("gera uma entrada por idioma publicado mais x-default", () => {
        const languages = languagesDe("/catalog")
        expect(Object.keys(languages)).toHaveLength(PUBLISHED_LOCALES.length + 1)
        expect(languages["x-default"]).toMatch(/\/catalog$/)
    })

    it("não anuncia locale roteável mas não publicado (ex.: ar)", () => {
        expect(languagesDe("/catalog")["ar"]).toBeUndefined()
    })

    it("não prefixa o idioma padrão", () => {
        const languages = languagesDe("/catalog")
        expect(languages["pt-BR"]).toMatch(/\/catalog$/)
        expect(languages["pt-BR"]).not.toMatch(/\/pt\//)
        expect(languages["de-DE"]).toMatch(/\/de\/catalog$/)
    })

    it("canonical aponta para o próprio idioma", () => {
        expect(alternatesFor("/catalog", "de").canonical).toMatch(/\/de\/catalog$/)
        expect(alternatesFor("/catalog", "pt").canonical).toMatch(/\/catalog$/)
    })

    it("trata a raiz sem barra dupla", () => {
        const languages = languagesDe("/")
        expect(languages["de-DE"]).toMatch(/\/de$/)
        expect(languages["de-DE"]).not.toMatch(/\/\/$/)
    })
})

describe("alternatesFor em página de lista", () => {
    it("usa self-canonical na variante de idioma", () => {
        expect(alternatesFor("/list/leads-alemanha", "de").canonical).toMatch(/\/de\/list\/leads-alemanha$/)
        expect(alternatesFor("/list/leads-alemanha", "pt").canonical).toMatch(/\/list\/leads-alemanha$/)
    })

    it("anuncia todas as variantes de idioma mais x-default", () => {
        const languages = languagesDe("/list/leads-alemanha")
        expect(Object.keys(languages)).toHaveLength(PUBLISHED_LOCALES.length + 1)
        expect(languages["de-DE"]).toMatch(/\/de\/list\/leads-alemanha$/)
        expect(languages["x-default"]).toMatch(/\/list\/leads-alemanha$/)
    })
})

describe("alternatesFor em rota de cobertura parcial", () => {
    // Cobertura explícita: é como o sitemap monta o hreflang do índice do
    // blog, cuja lista de idiomas sai da consulta de posts. O mesmo caminho
    // vale para /terms, /privacy e /refund no dia em que faltar documento
    // num idioma publicado (ver lib/seo/content-coverage).
    it("anuncia só os idiomas cobertos, mais x-default", () => {
        const languages = languagesDe("/blog", "pt", ["pt", "de"])
        expect(Object.keys(languages)).toEqual(["pt-BR", "de-DE", "x-default"])
    })

    it("a página do idioma sem conteúdo sai sem hreflang nenhum", () => {
        expect(alternatesFor("/blog", "fr", ["pt", "de"]).languages).toBeUndefined()
    })

    it("mesmo sem hreflang, canoniza para si mesma e não para o pt", () => {
        // Canonical cruzado junto com o noindex de robotsForPath seria o par
        // ambíguo que o Google pede para não usar.
        expect(alternatesFor("/blog", "fr", ["pt", "de"]).canonical).toMatch(/\/fr\/blog$/)
    })
})
