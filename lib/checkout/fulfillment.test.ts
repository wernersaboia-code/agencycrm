import { describe, it, expect, vi, beforeEach } from "vitest"
import { amountMatches, fulfillPurchase } from "./fulfillment"
import type { PrismaClient } from "@prisma/client"

// O fulfillment dispara e-mail e gera magic link depois de efetivar — os dois
// lados são I/O e ficam fora do teste unitário.
vi.mock("@/lib/auth/magic-link", () => ({
    generatePurchaseAccessToken: vi.fn().mockResolvedValue("token-falso"),
    generateMagicLinkUrl: vi.fn().mockReturnValue("https://app.test/acesso/token-falso"),
}))

vi.mock("@/lib/email/purchase", () => ({
    sendPurchaseConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}))

function createMockDb() {
    return {
        purchase: {
            findUnique: vi.fn(),
            updateMany: vi.fn(),
        },
    }
}

const pendingPurchase = {
    id: "purchase-1",
    userId: "user-1",
    status: "pending",
    total: "49.90",
    currency: "EUR",
}

const paidAmount = { value: "49.90", currency: "EUR" }

describe("amountMatches", () => {
    it("aceita valor e moeda idênticos", () => {
        expect(amountMatches({ value: "10.00", currency: "EUR" }, { total: 10, currency: "EUR" })).toBe(true)
    })

    it("normaliza o total esperado para 2 casas decimais", () => {
        expect(amountMatches({ value: "10.50", currency: "EUR" }, { total: 10.5, currency: "EUR" })).toBe(true)
        expect(amountMatches({ value: "10.00", currency: "EUR" }, { total: "10", currency: "EUR" })).toBe(true)
    })

    it("rejeita quando o valor capturado é menor que o esperado", () => {
        expect(amountMatches({ value: "9.99", currency: "EUR" }, { total: 10, currency: "EUR" })).toBe(false)
    })

    it("rejeita quando o valor capturado é maior que o esperado", () => {
        expect(amountMatches({ value: "100.00", currency: "EUR" }, { total: 10, currency: "EUR" })).toBe(false)
    })

    it("rejeita quando a moeda difere", () => {
        expect(amountMatches({ value: "10.00", currency: "USD" }, { total: 10, currency: "EUR" })).toBe(false)
    })

    it("rejeita quando não há valor capturado", () => {
        expect(amountMatches(null, { total: 10, currency: "EUR" })).toBe(false)
    })

    it("rejeita formatos não normalizados que não correspondem", () => {
        // "10" != "10.00": o PayPal sempre envia com 2 casas, então exigimos match exato.
        expect(amountMatches({ value: "10", currency: "EUR" }, { total: 10, currency: "EUR" })).toBe(false)
    })
})

describe("fulfillPurchase", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("paypal: localiza a compra por paypalOrderId", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchase)
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "paypal",
            providerOrderId: "PAYPAL-ORDER-1",
            capturedAmount: paidAmount,
            payer: { payerId: "PAYER-1", email: "comprador@teste.com", name: "Comprador" },
        })

        expect(db.purchase.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { paypalOrderId: "PAYPAL-ORDER-1" } })
        )
        expect(outcome.status).toBe("fulfilled")
    })

    it("stripe: localiza a compra por stripeSessionId", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchase)
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "stripe",
            providerOrderId: "cs_test_123",
            capturedAmount: paidAmount,
            payer: { email: "comprador@teste.com", name: "Comprador" },
            providerPaymentId: "pi_123",
        })

        expect(db.purchase.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { stripeSessionId: "cs_test_123" } })
        )
        expect(outcome.status).toBe("fulfilled")
    })

    it("stripe: efetiva gravando stripePaymentIntentId e nunca paypalPayerId", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchase)
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "stripe",
            providerOrderId: "cs_test_123",
            capturedAmount: paidAmount,
            providerPaymentId: "pi_123",
        })

        const [updateArgs] = db.purchase.updateMany.mock.calls[0]
        expect(updateArgs.data).toMatchObject({
            status: "paid",
            stripePaymentIntentId: "pi_123",
        })
        expect(updateArgs.data).not.toHaveProperty("paypalPayerId")
    })

    it("compra já paga devolve already_fulfilled sem tocar no banco", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue({ ...pendingPurchase, status: "paid" })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "stripe",
            providerOrderId: "cs_test_123",
            capturedAmount: paidAmount,
        })

        expect(outcome).toEqual({ status: "already_fulfilled", purchaseId: "purchase-1" })
        expect(db.purchase.updateMany).not.toHaveBeenCalled()
    })

    it("valor divergente devolve amount_mismatch e não marca como paga", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchase)

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "stripe",
            providerOrderId: "cs_test_123",
            capturedAmount: { value: "9.99", currency: "EUR" },
        })

        expect(outcome).toEqual({ status: "amount_mismatch", purchaseId: "purchase-1" })
        expect(db.purchase.updateMany).not.toHaveBeenCalled()
    })

    it("corrida perdida na transição devolve already_fulfilled", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchase)
        db.purchase.updateMany.mockResolvedValue({ count: 0 })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "paypal",
            providerOrderId: "PAYPAL-ORDER-1",
            capturedAmount: paidAmount,
        })

        expect(outcome).toEqual({ status: "already_fulfilled", purchaseId: "purchase-1" })
    })
})
