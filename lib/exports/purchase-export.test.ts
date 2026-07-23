import { describe, it, expect, vi, beforeEach } from "vitest"

const findFirst = vi.fn()
const update = vi.fn().mockResolvedValue({})

vi.mock("@/lib/prisma", () => ({
    prisma: {
        purchaseItem: {
            findFirst: (...args: unknown[]) => findFirst(...args),
            update: (...args: unknown[]) => update(...args),
        },
    },
}))

import { generatePurchaseCSV, generatePurchaseExcel } from "./purchase-export"

const paidItem = {
    id: "item-1",
    list: {
        slug: "minha-lista",
        leads: [
            { country: "Brasil", companyName: "ACME" },
        ],
    },
}

beforeEach(() => {
    findFirst.mockReset()
    update.mockClear()
})

describe("generatePurchaseCSV", () => {
    it("filtra apenas compras pagas do próprio usuário", async () => {
        findFirst.mockResolvedValue(paidItem)

        await generatePurchaseCSV("item-1", "user-1")

        expect(findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: "item-1",
                    purchase: { userId: "user-1", status: "paid" },
                },
            })
        )
    })

    it("rejeita uma compra pendente (não paga)", async () => {
        // O where com status "paid" faz o findFirst não encontrar a compra pendente.
        findFirst.mockResolvedValue(null)

        await expect(generatePurchaseCSV("item-1", "user-1")).rejects.toThrow(
            "Purchase item not found"
        )
        expect(update).not.toHaveBeenCalled()
    })
})

describe("generatePurchaseExcel", () => {
    it("filtra apenas compras pagas do próprio usuário", async () => {
        findFirst.mockResolvedValue(paidItem)

        await generatePurchaseExcel("item-1", "user-1")

        expect(findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: "item-1",
                    purchase: { userId: "user-1", status: "paid" },
                },
            })
        )
    })

    it("rejeita uma compra pendente (não paga)", async () => {
        findFirst.mockResolvedValue(null)

        await expect(generatePurchaseExcel("item-1", "user-1")).rejects.toThrow(
            "Purchase item not found"
        )
        expect(update).not.toHaveBeenCalled()
    })
})
