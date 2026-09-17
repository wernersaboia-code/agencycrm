import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    freeSampleDownload: { findUnique: vi.fn() },
    freeSample: { findFirst: vi.fn() },
}))
const signedUrlMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/supabase/free-sample", () => ({ createFreeSampleSignedUrl: signedUrlMock }))

import { GET } from "./route"

beforeEach(() => {
    vi.clearAllMocks()
    signedUrlMock.mockResolvedValue("https://storage/assinada")
})

describe("GET /free-sample/[token]", () => {
    it("serve o arquivo originalmente solicitado mesmo depois que a amostra ativa muda", async () => {
        prismaMock.freeSampleDownload.findUnique.mockResolvedValue({
            tokenExpiresAt: new Date(Date.now() + 60_000),
            sampleFilePath: "amostra-original.pdf",
        })

        const response = await GET(new Request("https://easyprospect.example/free-sample/token") as never, {
            params: Promise.resolve({ token: "token" }),
        })

        expect(signedUrlMock).toHaveBeenCalledWith("amostra-original.pdf")
        expect(prismaMock.freeSample.findFirst).not.toHaveBeenCalled()
        expect(response.status).toBe(307)
    })

    it("mantém os links legados funcionais usando a amostra ativa", async () => {
        prismaMock.freeSampleDownload.findUnique.mockResolvedValue({
            tokenExpiresAt: new Date(Date.now() + 60_000),
            sampleFilePath: null,
        })
        prismaMock.freeSample.findFirst.mockResolvedValue({ filePath: "amostra-atual.pdf" })

        await GET(new Request("https://easyprospect.example/free-sample/token") as never, {
            params: Promise.resolve({ token: "token" }),
        })

        expect(signedUrlMock).toHaveBeenCalledWith("amostra-atual.pdf")
    })
})
