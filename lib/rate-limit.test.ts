import { describe, it, expect, vi, beforeEach } from "vitest"

import { checkAdminRateLimit } from "./rate-limit"

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
