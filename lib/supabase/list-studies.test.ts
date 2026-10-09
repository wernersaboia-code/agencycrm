import { describe, it, expect } from "vitest"
import {
    validatePdfFile,
    extractStudyPathFromUrl,
    nomeArquivoDoEstudo,
    LIST_STUDIES_BUCKET,
} from "./list-studies"

describe("nomeArquivoDoEstudo", () => {
    it("troca espaços por sublinhado", () => {
        expect(nomeArquivoDoEstudo("Baby and Toddler Products Belgium")).toBe(
            "Baby_and_Toddler_Products_Belgium.pdf"
        )
    })

    it("tira acento e pontuação que sistema de arquivos estranha", () => {
        expect(nomeArquivoDoEstudo("Enxofre: Áustria / Österreich — 2026?")).toBe(
            "Enxofre_Austria_Osterreich_2026.pdf"
        )
    })

    it("não deixa nome vazio", () => {
        expect(nomeArquivoDoEstudo("  ★★ ")).toBe("study.pdf")
    })

    it("corta nome longo demais", () => {
        expect(nomeArquivoDoEstudo("a".repeat(300)).length).toBe(124)
    })
})

describe("validatePdfFile", () => {
    it("aceita PDF dentro do limite", () => {
        expect(validatePdfFile({ type: "application/pdf", size: 1_000_000 })).toEqual({ ok: true })
    })

    it("rejeita tipo não-PDF", () => {
        const r = validatePdfFile({ type: "image/png", size: 100 })
        expect(r.ok).toBe(false)
    })

    it("aceita PDF grande dentro do teto do bucket (40MB)", () => {
        expect(validatePdfFile({ type: "application/pdf", size: 40 * 1024 * 1024 })).toEqual({ ok: true })
    })

    it("rejeita arquivo acima de 50MB", () => {
        const r = validatePdfFile({ type: "application/pdf", size: 51 * 1024 * 1024 })
        expect(r.ok).toBe(false)
    })

    it("aceita PDF exatamente no limite de 50MB", () => {
        expect(validatePdfFile({ type: "application/pdf", size: 50 * 1024 * 1024 })).toEqual({ ok: true })
    })
})

describe("extractStudyPathFromUrl", () => {
    it("extrai o caminho relativo ao bucket a partir de uma URL", () => {
        const url = `https://x.supabase.co/storage/v1/object/sign/${LIST_STUDIES_BUCKET}/abc/study-1.pdf?token=y`
        expect(extractStudyPathFromUrl(url)).toBe("abc/study-1.pdf")
    })

    it("retorna o próprio valor quando já é um caminho", () => {
        expect(extractStudyPathFromUrl("abc/study-1.pdf")).toBe("abc/study-1.pdf")
    })
})
