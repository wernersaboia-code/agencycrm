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

    /**
     * O filtro do catálogo lista os países que têm estudo, então um código que
     * não é país nenhum vira uma opção morta na barra lateral — ou, pior, uma
     * segunda opção para um país que já está lá (o `UK` ao lado do `GB`).
     * Publicar assim entrega um estudo que a busca não encontra direito.
     */
    const PUBLICAVEL = { studyPdfUrl: "https://x/study.pdf", dataReviewedAt: REVIEWED }

    it("aceita país de qualquer parte do mundo", () => {
        expect(canPublishList({ ...PUBLICAVEL, countries: ["ZA", "VN", "KZ"] }).ok).toBe(true)
    })

    it("recusa publicar com código que não é país", () => {
        const result = canPublishList({ ...PUBLICAVEL, countries: ["DE", "XX"] })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.reason).toContain("XX")
    })

    it("recusa código obsoleto e diz qual usar", () => {
        const result = canPublishList({ ...PUBLICAVEL, countries: ["UK"] })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.reason).toContain("GB")
    })

    it("cobra o PDF antes do país quando faltam os dois", () => {
        // Ordem deliberada: sem PDF a compra não entrega nada, o que é pior
        // que um filtro incompleto.
        const result = canPublishList({ studyPdfUrl: null, dataReviewedAt: REVIEWED, countries: ["XX"] })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.reason).toMatch(/PDF/i)
    })

    it("não exige países para listas antigas que não os informam", () => {
        // `countries` é opcional no gate: quem chama sem o campo continua
        // sendo julgado só por PDF e revisão.
        expect(canPublishList(PUBLICAVEL).ok).toBe(true)
    })
})
