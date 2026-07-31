// lib/blog/unsaved-changes.test.ts
import { describe, it, expect } from "vitest"
import { temAlteracaoNaoSalva, toDatetimeLocalValue, type TranslationStateLike } from "./unsaved-changes"

const traducaoPt: TranslationStateLike = {
    title: "Título",
    slug: "titulo",
    excerpt: "Resumo",
    contentHtml: "<p>Conteúdo</p>",
    metaDescription: "Meta",
}

function baseParams(): Parameters<typeof temAlteracaoNaoSalva>[0] {
    const publishedAtIso = "2026-08-01T13:00:00.000Z"
    return {
        tr: { pt: { ...traducaoPt } },
        initialTranslations: { pt: { ...traducaoPt } },
        cover: "https://example.com/capa.png",
        initialCoverImageUrl: "https://example.com/capa.png",
        categoryId: "cat-1",
        initialCategoryId: "cat-1",
        status: "DRAFT",
        initialStatus: "DRAFT",
        publishedAt: toDatetimeLocalValue(publishedAtIso),
        initialPublishedAt: publishedAtIso,
    }
}

describe("temAlteracaoNaoSalva", () => {
    it("nada editado, com publishedAt vindo como ISO e estado já convertido -> false", () => {
        expect(temAlteracaoNaoSalva(baseParams())).toBe(false)
    })

    it("só a data editada -> true", () => {
        const params = baseParams()
        params.publishedAt = "2026-08-02T09:30"
        expect(temAlteracaoNaoSalva(params)).toBe(true)
    })

    it("só o conteúdo de um idioma editado -> true", () => {
        const params = baseParams()
        params.tr = { pt: { ...traducaoPt, title: "Título editado" } }
        expect(temAlteracaoNaoSalva(params)).toBe(true)
    })

    it("post sem data (initial.publishedAt nulo e estado vazio) -> false", () => {
        const params = baseParams()
        params.publishedAt = ""
        params.initialPublishedAt = null
        expect(temAlteracaoNaoSalva(params)).toBe(false)
    })
})
