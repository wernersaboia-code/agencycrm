import { describe, it, expect } from "vitest"
import { translationInputSchema, hasCompleteTranslation, assertPublishable } from "./blog"

describe("blog validations", () => {
    it("aceita tradução válida", () => {
        const r = translationInputSchema.safeParse({
            locale: "pt", title: "Olá", slug: "ola", excerpt: "resumo", contentHtml: "<p>oi</p>",
        })
        expect(r.success).toBe(true)
    })
    it("rejeita locale inválido", () => {
        const r = translationInputSchema.safeParse({
            locale: "xx", title: "Olá", slug: "ola", excerpt: "r", contentHtml: "<p>oi</p>",
        })
        expect(r.success).toBe(false)
    })
    it("detecta ao menos um idioma completo (ignora HTML vazio)", () => {
        expect(hasCompleteTranslation([{ title: "T", contentHtml: "<p></p>" }])).toBe(false)
        expect(hasCompleteTranslation([{ title: "T", contentHtml: "<p>corpo</p>" }])).toBe(true)
        expect(hasCompleteTranslation([{ title: "", contentHtml: "<p>corpo</p>" }])).toBe(false)
    })
    it("bloqueia publicação sem idioma completo", () => {
        expect(() => assertPublishable("PUBLISHED", [{ title: "T", contentHtml: "<p></p>" }])).toThrow()
        expect(() => assertPublishable("DRAFT", [{ title: "", contentHtml: "" }])).not.toThrow()
        expect(() => assertPublishable("PUBLISHED", [{ title: "T", contentHtml: "<p>x</p>" }])).not.toThrow()
    })
})
