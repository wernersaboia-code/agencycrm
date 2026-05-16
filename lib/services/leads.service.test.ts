import { describe, it, expect, vi } from "vitest"
import {
    getLeadStats,
    createLead,
    updateLead,
    deleteLead,
    importLeads,
    type ImportLeadData,
} from "./leads.service"
import type { PrismaClient } from "@prisma/client"

function createMockPrisma(overrides: Partial<PrismaClient> = {}): PrismaClient {
    return {
        lead: {
            findMany: vi.fn().mockResolvedValue([]),
            count: vi.fn().mockResolvedValue(0),
            findUnique: vi.fn().mockResolvedValue(null),
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({}),
            update: vi.fn().mockResolvedValue({}),
            delete: vi.fn().mockResolvedValue({}),
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            createMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        emailSend: {
            findMany: vi.fn().mockResolvedValue([]),
        },
        ...overrides,
    } as unknown as PrismaClient
}

const mockCtx = {
    user: { id: "user-1", email: "test@test.com", name: "Test" },
    prisma: createMockPrisma(),
}

describe("getLeadStats", () => {
    it("returns aggregated counts", async () => {
        const prisma = createMockPrisma()
        prisma.lead.count = vi
            .fn()
            .mockResolvedValueOnce(10)
            .mockResolvedValueOnce(3)
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(1)

        const stats = await getLeadStats(prisma, "ws-1")
        expect(stats).toEqual({ total: 10, new: 3, interested: 2, converted: 1 })
        expect(prisma.lead.count).toHaveBeenCalledTimes(4)
    })
})

describe("createLead", () => {
    it("creates a lead when email is unique", async () => {
        const prisma = createMockPrisma()
        prisma.lead.findUnique = vi.fn().mockResolvedValue(null)
        prisma.lead.create = vi.fn().mockResolvedValue({ id: "lead-1", email: "a@b.com" })

        const result = await createLead(prisma, {
            firstName: "John",
            email: "a@b.com",
            workspaceId: "ws-1",
        } as Parameters<typeof createLead>[1])

        expect(result.email).toBe("a@b.com")
        expect(prisma.lead.create).toHaveBeenCalledOnce()
    })

    it("throws DUPLICATE_EMAIL when lead exists", async () => {
        const prisma = createMockPrisma()
        prisma.lead.findUnique = vi.fn().mockResolvedValue({ id: "lead-1" })

        await expect(
            createLead(prisma, {
                firstName: "John",
                email: "a@b.com",
                workspaceId: "ws-1",
            } as Parameters<typeof createLead>[1])
        ).rejects.toThrow("DUPLICATE_EMAIL")
    })
})

describe("updateLead", () => {
    it("updates when lead exists and email is unique", async () => {
        const prisma = createMockPrisma()
        prisma.lead.findFirst = vi.fn().mockResolvedValue({ id: "lead-1", email: "old@b.com", workspaceId: "ws-1" })
        prisma.lead.findFirst = vi
            .fn()
            .mockResolvedValueOnce({ id: "lead-1", email: "old@b.com", workspaceId: "ws-1" })
            .mockResolvedValueOnce(null)
        prisma.lead.update = vi.fn().mockResolvedValue({ id: "lead-1", email: "new@b.com" })

        const result = await updateLead(prisma, mockCtx, "lead-1", { email: "new@b.com" })
        expect(result.email).toBe("new@b.com")
    })

    it("throws LEAD_NOT_FOUND when lead missing", async () => {
        const prisma = createMockPrisma()
        prisma.lead.findFirst = vi.fn().mockResolvedValue(null)

        await expect(updateLead(prisma, mockCtx, "lead-1", {})).rejects.toThrow("LEAD_NOT_FOUND")
    })
})

describe("deleteLead", () => {
    it("deletes when lead exists", async () => {
        const prisma = createMockPrisma()
        prisma.lead.findFirst = vi.fn().mockResolvedValue({ id: "lead-1" })
        prisma.lead.delete = vi.fn().mockResolvedValue({})

        await deleteLead(prisma, mockCtx, "lead-1")
        expect(prisma.lead.delete).toHaveBeenCalledWith({ where: { id: "lead-1" } })
    })

    it("throws LEAD_NOT_FOUND when lead missing", async () => {
        const prisma = createMockPrisma()
        prisma.lead.findFirst = vi.fn().mockResolvedValue(null)

        await expect(deleteLead(prisma, mockCtx, "lead-1")).rejects.toThrow("LEAD_NOT_FOUND")
    })
})

describe("importLeads", () => {
    it("imports valid leads and skips duplicates", async () => {
        const prisma = createMockPrisma()
        prisma.lead.findMany = vi.fn().mockResolvedValue([{ email: "dup@test.com" }])

        const leads: ImportLeadData[] = [
            { firstName: "Alice", email: "alice@test.com" },
            { firstName: "Bob", email: "dup@test.com" },
            { firstName: "", email: "charlie@test.com" },
        ]

        const result = await importLeads(prisma, "ws-1", leads)
        expect(result.imported).toBe(1)
        expect(result.duplicates).toBe(1)
        expect(result.errors).toBe(1)
        expect(prisma.lead.createMany).toHaveBeenCalledOnce()
    })
})
