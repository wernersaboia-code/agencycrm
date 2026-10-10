import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    freeSample: { findFirst: vi.fn() },
    freeSampleDownload: { create: vi.fn() },
}))
const signedUrlMock = vi.hoisted(() => vi.fn())
const authMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/supabase/free-sample", () => ({ createFreeSampleSignedUrl: signedUrlMock }))
vi.mock("@/lib/auth", () => ({ getAuthenticatedUser: authMock }))

import { GET } from "./route"

function pedido(query = "") {
    return new Request(`https://easyprospect.example/api/free-sample/account${query}`) as never
}

beforeEach(() => {
    vi.clearAllMocks()
    signedUrlMock.mockResolvedValue("https://storage/assinada")
    prismaMock.freeSample.findFirst.mockResolvedValue({ filePath: "amostra.pdf" })
    prismaMock.freeSampleDownload.create.mockResolvedValue({})
})

describe("GET /api/free-sample/account", () => {
    it("manda quem não está logado para o login, voltando a Minhas compras", async () => {
        authMock.mockResolvedValue(null)

        const response = await GET(pedido("?lang=de"))

        expect(response.status).toBe(307)
        const destino = new URL(response.headers.get("location")!)
        expect(destino.pathname).toBe("/sign-in")
        expect(destino.searchParams.get("redirect")).toBe("/my-purchases")
        expect(destino.searchParams.get("lang")).toBe("de")
        expect(signedUrlMock).not.toHaveBeenCalled()
    })

    it("entrega a amostra ativa a quem está logado e registra o download", async () => {
        authMock.mockResolvedValue({ id: "u1", email: "cliente@exemplo.com", name: null })

        const response = await GET(pedido("?lang=pt"))

        expect(signedUrlMock).toHaveBeenCalledWith("amostra.pdf")
        expect(response.status).toBe(307)
        expect(response.headers.get("location")).toBe("https://storage/assinada")
        expect(prismaMock.freeSampleDownload.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                email: "cliente@exemplo.com",
                consent: false,
                locale: "pt",
                sampleFilePath: "amostra.pdf",
            }),
        })
    })

    it("responde 404 quando não há amostra ativa", async () => {
        authMock.mockResolvedValue({ id: "u1", email: "cliente@exemplo.com", name: null })
        prismaMock.freeSample.findFirst.mockResolvedValue(null)

        const response = await GET(pedido())

        expect(response.status).toBe(404)
        expect(signedUrlMock).not.toHaveBeenCalled()
    })

    it("entrega o arquivo mesmo se o registro do download falhar", async () => {
        authMock.mockResolvedValue({ id: "u1", email: "cliente@exemplo.com", name: null })
        prismaMock.freeSampleDownload.create.mockRejectedValue(new Error("banco fora"))

        const response = await GET(pedido())

        expect(response.status).toBe(307)
        expect(response.headers.get("location")).toBe("https://storage/assinada")
    })

    it("ignora idioma desconhecido e usa o padrão", async () => {
        authMock.mockResolvedValue(null)

        const response = await GET(pedido("?lang=xx"))

        const destino = new URL(response.headers.get("location")!)
        expect(destino.searchParams.get("lang")).toBe("pt")
    })
})
