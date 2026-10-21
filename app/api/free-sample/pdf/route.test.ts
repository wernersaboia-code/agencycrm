import { beforeEach, describe, expect, it, vi } from "vitest"

const amostraMock = vi.hoisted(() => vi.fn())
const signedUrlMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/free-sample/amostra-ativa", () => ({ getAmostraAtiva: amostraMock }))
vi.mock("@/lib/supabase/free-sample", () => ({ createFreeSampleSignedUrl: signedUrlMock }))

import { GET } from "./route"

beforeEach(() => {
    vi.clearAllMocks()
    amostraMock.mockResolvedValue({ id: "a1", filePath: "sample-123.pdf" })
    signedUrlMock.mockResolvedValue("https://storage/assinada")
})

describe("GET /api/free-sample/pdf", () => {
    it("redireciona para a URL assinada da amostra ativa", async () => {
        const response = await GET()

        expect(signedUrlMock).toHaveBeenCalledWith("sample-123.pdf", 60 * 60)
        expect(response.status).toBe(307)
        expect(response.headers.get("location")).toBe("https://storage/assinada")
        // A assinatura expira; nenhum cache pode guardá-la.
        expect(response.headers.get("cache-control")).toBe("no-store")
    })

    it("responde 404 quando não há amostra ativa", async () => {
        amostraMock.mockResolvedValue(null)

        const response = await GET()

        expect(response.status).toBe(404)
        expect(signedUrlMock).not.toHaveBeenCalled()
    })

    it("responde 500 quando o storage não consegue assinar", async () => {
        signedUrlMock.mockRejectedValue(new Error("storage fora"))

        const response = await GET()

        expect(response.status).toBe(500)
    })
})
