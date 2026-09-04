import { describe, expect, it } from "vitest"
import { alternatesFor, canonicalDefaultLocale } from "./alternates"
import { PUBLISHED_LOCALES } from "./locales"

/**
 * `/catalog` tira o texto de messages/ e vale nos 8 idiomas — serve de rota
 * "coberta em todos" nos testes abaixo. `/terms` vem de content/legal e hoje
 * não tem árabe: é a rota de cobertura parcial.
 */
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

    it("anuncia o árabe como qualquer outro locale publicado", () => {
        expect(languagesDe("/catalog")["ar"]).toMatch(/\/ar\/catalog$/)
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

    it("árabe canoniza para si mesmo agora que é publicado", () => {
        expect(alternatesFor("/catalog", "ar").canonical).toMatch(/\/ar\/catalog$/)
    })

    it("trata a raiz sem barra dupla", () => {
        const languages = languagesDe("/")
        expect(languages["de-DE"]).toMatch(/\/de$/)
        expect(languages["de-DE"]).not.toMatch(/\/\/$/)
    })
})

describe("alternatesFor em rota de cobertura parcial", () => {
    // /terms vem de content/legal, que não tem documento árabe. A página
    // existe e abre (cai no português), mas não é uma variante de idioma.
    it("não anuncia o idioma sem documento no hreflang dos que têm", () => {
        const languages = languagesDe("/terms")
        expect(languages["de-DE"]).toMatch(/\/de\/terms$/)
        expect(languages["ar"]).toBeUndefined()
        expect(Object.keys(languages)).toHaveLength(PUBLISHED_LOCALES.length - 1 + 1)
    })

    it("a página do idioma sem documento sai sem hreflang nenhum", () => {
        const semDocumento = alternatesFor("/terms", "ar")
        expect(semDocumento.languages).toBeUndefined()
    })

    it("mesmo sem hreflang, canoniza para si mesma e não para o pt", () => {
        // Canonical cruzado junto com o noindex de robotsForPath seria o par
        // ambíguo que o Google pede para não usar.
        expect(alternatesFor("/terms", "ar").canonical).toMatch(/\/ar\/terms$/)
    })

    it("aceita cobertura explícita, para a rota que depende do banco", () => {
        // É como o sitemap monta o hreflang do índice do blog: a lista de
        // idiomas sai da consulta de posts, não de um mapa estático.
        const languages = languagesDe("/blog", "pt", ["pt", "de"])
        expect(Object.keys(languages)).toEqual(["pt-BR", "de-DE", "x-default"])

        expect(alternatesFor("/blog", "ar", ["pt", "de"]).languages).toBeUndefined()
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
