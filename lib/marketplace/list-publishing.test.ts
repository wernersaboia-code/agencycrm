import { describe, it, expect } from "vitest"
import { canPublishList } from "./list-publishing"

const REVIEWED = new Date("2026-07-01T00:00:00Z")

describe("canPublishList", () => {
    it("recusa publicar lista sem PDF de estudo", () => {
        const result = canPublishList({ studyPdfUrl: null, dataReviewedAt: REVIEWED })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.reason).toMatch(/PDF/i)
    })

    it("recusa string vazia como PDF válido", () => {
        expect(canPublishList({ studyPdfUrl: "   ", dataReviewedAt: REVIEWED }).ok).toBe(false)
    })

    it("recusa publicar lista sem data de revisão dos dados", () => {
        const result = canPublishList({ studyPdfUrl: "https://x/study.pdf", dataReviewedAt: null })
        expect(result.ok).toBe(false)
        // O FAQ promete que a página da lista mostra quando os dados foram
        // revisados; sem a data a promessa quebra no ar.
        if (!result.ok) expect(result.reason).toMatch(/revis/i)
    })

    it("dá motivos distintos para PDF ausente e revisão ausente", () => {
        const semPdf = canPublishList({ studyPdfUrl: null, dataReviewedAt: REVIEWED })
        const semRevisao = canPublishList({ studyPdfUrl: "https://x/study.pdf", dataReviewedAt: null })

        expect(semPdf.ok).toBe(false)
        expect(semRevisao.ok).toBe(false)
        if (!semPdf.ok && !semRevisao.ok) {
            expect(semPdf.reason).not.toBe(semRevisao.reason)
        }
    })

    it("aponta o PDF primeiro quando faltam as duas condições", () => {
        const result = canPublishList({ studyPdfUrl: null, dataReviewedAt: null })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.reason).toMatch(/PDF/i)
    })

    it("aceita lista com PDF e data de revisão", () => {
        expect(canPublishList({ studyPdfUrl: "https://x/study.pdf", dataReviewedAt: REVIEWED }).ok).toBe(true)
    })
})
