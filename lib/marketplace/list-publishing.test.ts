import { describe, it, expect } from "vitest"
import { canPublishList } from "./list-publishing"

describe("canPublishList", () => {
    it("recusa publicar lista sem PDF de estudo", () => {
        const result = canPublishList({ studyPdfUrl: null })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.reason).toMatch(/PDF/i)
    })

    it("recusa string vazia como PDF válido", () => {
        expect(canPublishList({ studyPdfUrl: "   " }).ok).toBe(false)
    })

    it("aceita lista com PDF", () => {
        expect(canPublishList({ studyPdfUrl: "https://x/study.pdf" }).ok).toBe(true)
    })
})
