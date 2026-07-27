import { describe, it, expect, vi, beforeEach } from "vitest"

import { checkAdminRateLimit, tooManyRequestsResponse } from "./rate-limit"

// O helper checkAdminRateLimit chama checkPersistentRateLimit que usa
// prisma.rateLimit.upsert. Mockamos o prisma para não tocar no banco.
vi.mock("@/lib/prisma", () => ({
    prisma: {
        rateLimit: {
            upsert: vi.fn(),
        },
    },
}))

describe("checkAdminRateLimit", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("não lança quando dentro do limite", async () => {
        const { prisma } = await import("@/lib/prisma")
        vi.mocked(prisma.rateLimit.upsert).mockResolvedValue({ count: 5 } as never)

        await expect(
            checkAdminRateLimit("test.action", "admin-1", 10, 60_000)
        ).resolves.toBeUndefined()

        expect(prisma.rateLimit.upsert).toHaveBeenCalled()
    })

    it("lança erro quando excede o limite", async () => {
        const { prisma } = await import("@/lib/prisma")
        vi.mocked(prisma.rateLimit.upsert).mockResolvedValue({ count: 15 } as never)

        await expect(
            checkAdminRateLimit("test.action", "admin-1", 10, 60_000)
        ).rejects.toThrow("Limite de requisições excedido")
    })

    it("usa valores padrão de limit e windowMs", async () => {
        const { prisma } = await import("@/lib/prisma")
        vi.mocked(prisma.rateLimit.upsert).mockResolvedValue({ count: 3 } as never)

        await checkAdminRateLimit("test.action", "admin-1")

        expect(prisma.rateLimit.upsert).toHaveBeenCalled()
    })
})

describe("tooManyRequestsResponse", () => {
    // O proxy usa esta resposta nas telas de auth, que são elas próprias
    // limitadas. Qualquer redirect aqui viraria loop: a tela de destino cairia
    // no mesmo limite e devolveria outro redirect.
    it("responde 429 sem redirecionar", () => {
        const response = tooManyRequestsResponse()

        expect(response.status).toBe(429)
        expect(response.headers.get("location")).toBeNull()
    })

    it("informa em quanto tempo tentar de novo", async () => {
        const response = tooManyRequestsResponse(30)

        expect(response.headers.get("retry-after")).toBe("30")
        expect(await response.text()).toContain("30 segundos")
    })

    it("não é indexável", async () => {
        expect(await tooManyRequestsResponse().text()).toContain("noindex")
    })
})
