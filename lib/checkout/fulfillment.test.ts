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

/**
 * Uma compra pendente do provedor indicado. É função, não constante, porque
 * `provider` faz parte do que a busca compara — um mock sem esse campo
 * representaria uma linha que não existe no banco.
 */
function pendingPurchaseDe(provider: string, overrides: Record<string, unknown> = {}) {
    return {
        id: "purchase-1",
        userId: "user-1",
        provider,
        status: "pending",
        total: "49.90",
        currency: "EUR",
        ...overrides,
    }
}

/** Compra em BRL, moeda em que o Mercado Pago sempre cobra. */
function pendingPurchaseMp(overrides: Record<string, unknown> = {}) {
    return pendingPurchaseDe("mercadopago", { total: "289.00", currency: "BRL", ...overrides })
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
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseDe("paypal"))
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
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseDe("stripe"))
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
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseDe("stripe"))
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
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseDe("stripe", { status: "paid" }))

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
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseDe("stripe"))

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "stripe",
            providerOrderId: "cs_test_123",
            capturedAmount: { value: "9.99", currency: "EUR" },
        })

        expect(outcome).toEqual({ status: "amount_mismatch", purchaseId: "purchase-1" })
        expect(db.purchase.updateMany).not.toHaveBeenCalled()
    })

    it("mercadopago: compra failed com valor aprovado batendo É efetivada", async () => {
        // Recusa no Mercado Pago encerra a TENTATIVA, não o pedido: a mesma
        // preferência continua viva e o comprador tenta de novo por outro meio.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseMp({ status: "failed" }))
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "mercadopago",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "289.00", currency: "BRL" },
            providerPaymentId: "mp-pay-2",
        })

        expect(outcome.status).toBe("fulfilled")
        expect(db.purchase.updateMany).toHaveBeenCalled()
    })

    it("mercadopago: compra failed com valor divergente NÃO é efetivada", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseMp({ status: "failed" }))

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "mercadopago",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "1.00", currency: "BRL" },
        })

        expect(outcome).toEqual({ status: "amount_mismatch", purchaseId: "purchase-1" })
        expect(db.purchase.updateMany).not.toHaveBeenCalled()
    })

    it("mercadopago: compra já paga continua terminal e não toca no banco", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseMp({ status: "paid" }))

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "mercadopago",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "289.00", currency: "BRL" },
        })

        expect(outcome).toEqual({ status: "already_fulfilled", purchaseId: "purchase-1" })
        expect(db.purchase.updateMany).not.toHaveBeenCalled()
    })

    it("stripe: compra failed continua terminal — o resgate é só do Mercado Pago", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseDe("stripe", { status: "failed" }))

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "stripe",
            providerOrderId: "cs_test_123",
            capturedAmount: paidAmount,
        })

        expect(outcome).toEqual({ status: "already_fulfilled", purchaseId: "purchase-1" })
        expect(db.purchase.updateMany).not.toHaveBeenCalled()
    })

    it("mercadopago: a transição condicional aceita pending E failed", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseMp())
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "mercadopago",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "289.00", currency: "BRL" },
        })

        const [updateArgs] = db.purchase.updateMany.mock.calls[0]
        expect(updateArgs.where).toEqual({ id: "purchase-1", status: { in: ["pending", "failed"] } })
    })

    it("stripe: a transição condicional continua exigindo pending", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseDe("stripe"))
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "stripe",
            providerOrderId: "cs_test_123",
            capturedAmount: paidAmount,
        })

        const [updateArgs] = db.purchase.updateMany.mock.calls[0]
        expect(updateArgs.where).toEqual({ id: "purchase-1", status: "pending" })
    })

    it("não efetiva compra de outro provedor mesmo achando pelo id", async () => {
        // Só o Mercado Pago busca por chave primária. Sem esta checagem, um id
        // que casasse traria uma compra de outro provedor para este fluxo.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseDe("stripe"))

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "mercadopago",
            providerOrderId: "purchase-1",
            capturedAmount: paidAmount,
        })

        expect(outcome).toEqual({ status: "not_found" })
        expect(db.purchase.updateMany).not.toHaveBeenCalled()
    })

    it("corrida perdida na transição devolve already_fulfilled", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseDe("paypal"))
        db.purchase.updateMany.mockResolvedValue({ count: 0 })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "paypal",
            providerOrderId: "PAYPAL-ORDER-1",
            capturedAmount: paidAmount,
        })

        expect(outcome).toEqual({ status: "already_fulfilled", purchaseId: "purchase-1" })
    })

    it("mercadopago: localiza a compra pelo próprio purchase.id", async () => {
        // O webhook do Mercado Pago entrega só o ID do pagamento; quem amarra
        // o pagamento ao pedido é o external_reference, que É o nosso id.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseMp())
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "mercadopago",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "289.00", currency: "BRL" },
            payer: { email: "comprador@teste.com", name: "Comprador" },
            providerPaymentId: "mp-pay-1",
        })

        expect(db.purchase.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: "purchase-1" } })
        )
        expect(outcome.status).toBe("fulfilled")
    })

    it("mercadopago: grava mercadoPagoPaymentId e nenhum campo dos outros provedores", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseMp())
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "mercadopago",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "289.00", currency: "BRL" },
            providerPaymentId: "mp-pay-1",
        })

        const [updateArgs] = db.purchase.updateMany.mock.calls[0]
        expect(updateArgs.data).toMatchObject({
            status: "paid",
            mercadoPagoPaymentId: "mp-pay-1",
        })
        expect(updateArgs.data).not.toHaveProperty("paypalPayerId")
        expect(updateArgs.data).not.toHaveProperty("stripePaymentIntentId")
    })

    it("mercadopago: valor em moeda diferente de BRL não efetiva", async () => {
        // Rede de proteção contra o modo de falha central do Mercado Pago:
        // ele não converte, então um valor rotulado EUR sobre compra em BRL
        // significa que alguma coisa a montante montou o pedido errado.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseMp())

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "mercadopago",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "289.00", currency: "EUR" },
        })

        expect(outcome).toEqual({ status: "amount_mismatch", purchaseId: "purchase-1" })
        expect(db.purchase.updateMany).not.toHaveBeenCalled()
    })

    it("paddle: localiza a compra pelo próprio purchase.id", async () => {
        // Igual ao Mercado Pago: quem amarra a transação ao pedido é o
        // custom_data, que carrega o nosso id.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseDe("paddle", { currency: "EUR", total: "45.00" }))
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "paddle",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "45.00", currency: "EUR" },
            payer: { email: "comprador@teste.com" },
            providerPaymentId: "txn_1",
        })

        expect(db.purchase.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: "purchase-1" } })
        )
        expect(outcome.status).toBe("fulfilled")
    })

    it("paddle: grava paddleTransactionId e nenhum campo dos outros provedores", async () => {
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseDe("paddle", { currency: "EUR", total: "45.00" }))
        db.purchase.updateMany.mockResolvedValue({ count: 1 })

        await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "paddle",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "45.00", currency: "EUR" },
            providerPaymentId: "txn_1",
        })

        const [updateArgs] = db.purchase.updateMany.mock.calls[0]
        expect(updateArgs.data).toMatchObject({
            status: "paid",
            paddleTransactionId: "txn_1",
        })
        expect(updateArgs.data).not.toHaveProperty("mercadoPagoPaymentId")
        expect(updateArgs.data).not.toHaveProperty("stripePaymentIntentId")
    })

    it("paddle: failed é terminal, ao contrário do Mercado Pago", async () => {
        // No Mercado Pago a mesma preferência sobrevive a uma recusa. No
        // Paddle o comprador retenta dentro do overlay, na MESMA transação,
        // então `failed` só é gravado em evento definitivo.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(
            pendingPurchaseDe("paddle", { status: "failed", currency: "EUR", total: "45.00" })
        )

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "paddle",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "45.00", currency: "EUR" },
        })

        expect(outcome).toEqual({ status: "already_fulfilled", purchaseId: "purchase-1" })
        expect(db.purchase.updateMany).not.toHaveBeenCalled()
    })

    it("paddle: quem perde a corrida não reenvia e-mail", async () => {
        // confirm-transaction e webhook chegam quase juntos. A leitura acima
        // vê `pending` nos dois, e é o updateMany condicional que decide: o
        // segundo encontra count 0.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseDe("paddle", { currency: "EUR", total: "45.00" }))
        db.purchase.updateMany.mockResolvedValue({ count: 0 })

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "paddle",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "45.00", currency: "EUR" },
            providerPaymentId: "txn_1",
        })

        expect(outcome).toEqual({ status: "already_fulfilled", purchaseId: "purchase-1" })
    })

    it("paddle: pagamento não efetiva compra de outro provedor", async () => {
        // A busca do Paddle é por chave primária e acharia compra de qualquer
        // provedor — a guarda de provider é a única linha que impede isso.
        const db = createMockDb()
        db.purchase.findUnique.mockResolvedValue(pendingPurchaseMp())

        const outcome = await fulfillPurchase(db as unknown as PrismaClient, {
            provider: "paddle",
            providerOrderId: "purchase-1",
            capturedAmount: { value: "289.00", currency: "BRL" },
        })

        expect(outcome).toEqual({ status: "not_found" })
        expect(db.purchase.updateMany).not.toHaveBeenCalled()
    })
})
