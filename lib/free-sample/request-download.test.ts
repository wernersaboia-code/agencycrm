import { describe, it, expect, vi, beforeEach } from "vitest"

// Banco, storage e e-mail são I/O e ficam fora do teste unitário. O que
// interessa aqui é a DECISÃO tomada antes deles.
const prismaMock = vi.hoisted(() => ({
    freeSample: { findFirst: vi.fn() },
    freeSampleDownload: { count: vi.fn(), create: vi.fn() },
}))

const sendEmailMock = vi.hoisted(() => vi.fn().mockResolvedValue({ success: true }))
const signedUrlMock = vi.hoisted(() => vi.fn().mockResolvedValue("https://storage/assinada"))

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/email", () => ({ sendEmail: sendEmailMock }))
vi.mock("@/lib/email/system-smtp", () => ({ getSystemSmtpConfig: vi.fn().mockReturnValue({}) }))
vi.mock("@/lib/supabase/free-sample", () => ({ createFreeSampleSignedUrl: signedUrlMock }))
vi.mock("next/headers", () => ({
    headers: vi.fn().mockResolvedValue(new Headers({ "x-forwarded-for": "203.0.113.1" })),
}))
// O limiter em memória é real (não mockado) e vive no escopo do módulo: sem
// isolar, sua cache persiste entre os `it()` deste arquivo (mesmo IP falso em
// todos), e testes que chegam até ele se acumulam até estourar o próprio
// limite — travando um teste que não tem nada a ver com rate limit. Nenhum
// dos casos abaixo testa o limiter em memória (o "rate_limited" cobre o
// backstop persistido no banco), então mocká-lo para sempre liberar é seguro.
vi.mock("@/lib/rate-limit", () => ({
    rateLimit: () => ({ check: vi.fn().mockResolvedValue(undefined) }),
}))

import { requestFreeSample } from "./request-download"

const valido = { email: "werner@example.com", consent: true as const, locale: "pt" as const }
const amostraAtiva = { id: "s1", filePath: "sample-1.pdf", fileName: "amostra.pdf" }

beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.freeSample.findFirst.mockResolvedValue(amostraAtiva)
    prismaMock.freeSampleDownload.count.mockResolvedValue(0)
    prismaMock.freeSampleDownload.create.mockResolvedValue({})
    signedUrlMock.mockResolvedValue("https://storage/assinada")
    sendEmailMock.mockResolvedValue({ success: true })
})

describe("requestFreeSample", () => {
    it("grava o pedido e devolve a URL de download", async () => {
        const r = await requestFreeSample(valido)

        expect(r).toEqual({ success: true, downloadUrl: "https://storage/assinada" })
        expect(prismaMock.freeSampleDownload.create).toHaveBeenCalledOnce()
    })

    it("recusa e-mail inválido sem tocar no banco", async () => {
        const r = await requestFreeSample({ ...valido, email: "xx" })

        expect(r).toEqual({ success: false, error: "invalid" })
        expect(prismaMock.freeSampleDownload.create).not.toHaveBeenCalled()
    })

    // Honeypot: responder sucesso sem efeito algum, para não dar sinal ao bot.
    it("finge sucesso e não grava quando o honeypot vem preenchido", async () => {
        const r = await requestFreeSample({ ...valido, website: "http://spam.example" })

        expect(r).toEqual({ success: true })
        expect(prismaMock.freeSampleDownload.create).not.toHaveBeenCalled()
    })

    // Sem arquivo ativo a seção nem deveria estar na tela; se chegou aqui é
    // formulário de página aberta antes de o admin desligar.
    it("responde unavailable quando não há amostra ativa", async () => {
        prismaMock.freeSample.findFirst.mockResolvedValue(null)

        const r = await requestFreeSample(valido)

        expect(r).toEqual({ success: false, error: "unavailable" })
        expect(prismaMock.freeSampleDownload.create).not.toHaveBeenCalled()
    })

    it("bloqueia quando o mesmo IP passou do limite persistido", async () => {
        prismaMock.freeSampleDownload.count.mockResolvedValue(5)

        const r = await requestFreeSample(valido)

        expect(r).toEqual({ success: false, error: "rate_limited" })
        expect(prismaMock.freeSampleDownload.create).not.toHaveBeenCalled()
    })

    // ESTE É O PONTO DA FEATURE: o envio de e-mail é frágil (o .env autentica
    // no Gmail enquanto o contato@ é Zoho). Se o download dependesse dele, a
    // falha seria silenciosa — o visitante deixaria o contato e não receberia
    // nada.
    it("entrega o download mesmo quando o e-mail falha", async () => {
        sendEmailMock.mockResolvedValue({ success: false, error: "SMTP recusou" })

        const r = await requestFreeSample(valido)

        expect(r).toEqual({ success: true, downloadUrl: "https://storage/assinada" })
        expect(prismaMock.freeSampleDownload.create).toHaveBeenCalledOnce()
    })

    it("grava o consentimento e o idioma junto do e-mail", async () => {
        await requestFreeSample({ ...valido, locale: "de" })

        const gravado = prismaMock.freeSampleDownload.create.mock.calls[0][0].data
        expect(gravado.email).toBe("werner@example.com")
        expect(gravado.consent).toBe(true)
        expect(gravado.locale).toBe("de")
        expect(gravado.token).toEqual(expect.any(String))
        expect(gravado.tokenExpiresAt).toBeInstanceOf(Date)
    })
})
