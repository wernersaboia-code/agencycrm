import { describe, expect, it } from "vitest"

import { sanitizeTranslations } from "./sanitize-translations"

type Translation = {
    locale: string
    title: string
    slug: string
    excerpt: string
    contentHtml: string
}

function translation(contentHtml: string, overrides: Partial<Translation> = {}): Translation {
    return {
        locale: "pt",
        title: "Título",
        slug: "titulo",
        excerpt: "Resumo",
        contentHtml,
        ...overrides,
    }
}

describe("sanitizeTranslations (função de produção)", () => {
    it("descarta o style sujo do Word mas preserva text-align", () => {
        const [result] = sanitizeTranslations([
            translation('<p style="font-family:Calibri; mso-bidi-font-size:11pt; text-align:center">meio</p>'),
        ])
        expect(result.contentHtml).not.toContain("Calibri")
        expect(result.contentHtml).not.toContain("mso-")
        expect(result.contentHtml).toMatch(/text-align:\s*center/)
    })

    it("remove script", () => {
        const [result] = sanitizeTranslations([
            translation('<p style="font-family:Calibri">ok</p><script>alert(1)</script>'),
        ])
        expect(result.contentHtml).toBe("<p>ok</p>")
    })

    it("não deixa javascript: sobreviver em href", () => {
        const [result] = sanitizeTranslations([
            translation('<a href="javascript:alert(1)" style="font-size:11pt">x</a>'),
        ])
        expect(result.contentHtml).not.toContain("javascript:")
    })

    it("não deixa metadados do <xml> do Word vazarem como texto solto", () => {
        // `xml` é nonTextTag na limpeza (`lib/blog/paste-cleanup.ts`), mas não
        // no sanitizador (`lib/utils/html-sanitizer.ts`): lá é só uma tag
        // desconhecida, cujo TEXTO sobrevive. Rodando a limpeza primeiro (ordem
        // certa), a tag e o conteúdo somem juntos antes de chegar ao
        // sanitizador. Invertida, o sanitizador já rodou, deixou o texto do
        // `<xml>` solto na página, e a limpeza — que roda por último nessa
        // ordem errada — não tem mais tag nenhuma para reconhecer e remover.
        const [result] = sanitizeTranslations([
            translation('<p>keep</p><xml>o:OfficeDocumentSettings leaked metadata here</xml>'),
        ])
        expect(result.contentHtml).not.toContain("leaked metadata")
        expect(result.contentHtml).toBe("<p>keep</p>")
    })

    it("preserva a imagem inserida pelo botão de imagem (com alt) ao salvar o post", () => {
        const [result] = sanitizeTranslations([
            translation('<p>Antes</p><img src="https://exemplo.com/a.png" alt="x"><p>Depois</p>'),
        ])
        expect(result.contentHtml).toContain('<img src="https://exemplo.com/a.png" alt="x"')
        expect(result.contentHtml).toContain("<p>Antes</p>")
        expect(result.contentHtml).toContain("<p>Depois</p>")
    })

    it("preserva os demais campos da tradução, alterando só contentHtml", () => {
        const input = translation('<p style="font-family:Calibri">ok</p>', {
            locale: "en",
            title: "Title",
            slug: "title",
            excerpt: "Excerpt",
        })
        const [result] = sanitizeTranslations([input])
        expect(result.locale).toBe("en")
        expect(result.title).toBe("Title")
        expect(result.slug).toBe("title")
        expect(result.excerpt).toBe("Excerpt")
        expect(result.contentHtml).not.toBe(input.contentHtml)
    })
})
