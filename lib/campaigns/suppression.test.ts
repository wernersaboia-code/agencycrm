import { describe, it, expect, vi } from "vitest"
import type { PrismaClient } from "@prisma/client"
import {
    normalizeEmail,
    isSuppressed,
    filterSuppressed,
    addSuppression,
    removeSuppression,
} from "./suppression"

function createMockPrisma(overrides: Record<string, unknown> = {}): PrismaClient {
    return {
        suppression: {
            findFirst: vi.fn().mockResolvedValue(null),
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn().mockResolvedValue({}),
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            ...overrides,
        },
    } as unknown as PrismaClient
}

describe("normalizeEmail", () => {
    it("remove espaços e baixa a caixa", () => {
        expect(normalizeEmail("  Joao@Empresa.DE ")).toBe("joao@empresa.de")
    })
})

describe("isSuppressed", () => {
    it("é verdadeiro quando existe registro global ou do workspace", async () => {
        const prisma = createMockPrisma({
            findFirst: vi.fn().mockResolvedValue({ id: "s1" }),
        })
        await expect(isSuppressed(prisma, "A@B.com", "ws-1")).resolves.toBe(true)
        expect(prisma.suppression.findFirst).toHaveBeenCalledWith({
            where: {
                email: "a@b.com",
                OR: [{ workspaceId: null }, { workspaceId: "ws-1" }],
            },
            select: { id: true },
        })
    })

    it("é falso quando não existe registro", async () => {
        const prisma = createMockPrisma()
        await expect(isSuppressed(prisma, "a@b.com", "ws-1")).resolves.toBe(false)
    })

    it("fail-closed: erro de banco suprime o envio", async () => {
        const prisma = createMockPrisma({
            findFirst: vi.fn().mockRejectedValue(new Error("db down")),
        })
        await expect(isSuppressed(prisma, "a@b.com", "ws-1")).resolves.toBe(true)
    })
})

describe("filterSuppressed", () => {
    it("devolve o conjunto de e-mails suprimidos, normalizados", async () => {
        const prisma = createMockPrisma({
            findMany: vi.fn().mockResolvedValue([{ email: "a@b.com" }]),
        })
        const result = await filterSuppressed(prisma, ["A@B.com", "c@d.com"], "ws-1")
        expect(result.has("a@b.com")).toBe(true)
        expect(result.has("c@d.com")).toBe(false)
    })

    it("propaga o erro de banco para o chamador abortar o lote", async () => {
        const prisma = createMockPrisma({
            findMany: vi.fn().mockRejectedValue(new Error("db down")),
        })
        await expect(
            filterSuppressed(prisma, ["a@b.com"], "ws-1")
        ).rejects.toThrow("db down")
    })
})

describe("addSuppression", () => {
    it("cria o registro com o e-mail normalizado", async () => {
        const prisma = createMockPrisma()
        await addSuppression(prisma, {
            email: " X@Y.com ",
            workspaceId: "ws-1",
            reason: "hard_bounce",
            detail: "550 user unknown",
        })
        expect(prisma.suppression.create).toHaveBeenCalledWith({
            data: {
                email: "x@y.com",
                workspaceId: "ws-1",
                reason: "hard_bounce",
                detail: "550 user unknown",
            },
        })
    })

    it("não duplica quando já existe registro equivalente", async () => {
        const prisma = createMockPrisma({
            findFirst: vi.fn().mockResolvedValue({ id: "s1" }),
        })
        await addSuppression(prisma, {
            email: "x@y.com",
            workspaceId: "ws-1",
            reason: "unsubscribe",
        })
        expect(prisma.suppression.create).not.toHaveBeenCalled()
    })

    it("nunca lança quando o banco falha", async () => {
        const prisma = createMockPrisma({
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockRejectedValue(new Error("db down")),
        })
        await expect(
            addSuppression(prisma, {
                email: "x@y.com",
                workspaceId: null,
                reason: "manual",
            })
        ).resolves.toBeUndefined()
    })
})

describe("removeSuppression", () => {
    it("só apaga registros do próprio workspace", async () => {
        const prisma = createMockPrisma()
        await removeSuppression(prisma, "s1", "ws-1")
        expect(prisma.suppression.deleteMany).toHaveBeenCalledWith({
            where: { id: "s1", workspaceId: "ws-1" },
        })
    })
})
