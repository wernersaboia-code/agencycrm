import { describe, it, expect } from "vitest"
import { toStripeAmount, fromStripeAmount } from "./stripe"

describe("toStripeAmount", () => {
    it("converte reais para centavos", () => {
        expect(toStripeAmount(10)).toBe(1000)
        expect(toStripeAmount(49.9)).toBe(4990)
    })

    it("elimina ruído de ponto flutuante na multiplicação", () => {
        // 19.99 * 100 = 1998.9999999999998 em IEEE-754 — tem que virar 1999.
        expect(toStripeAmount(19.99)).toBe(1999)
        expect(toStripeAmount(0.29)).toBe(29)
    })

    it("devolve inteiro (o Stripe recusa centavo quebrado)", () => {
        expect(Number.isInteger(toStripeAmount(12.345))).toBe(true)
    })
})

describe("fromStripeAmount", () => {
    it("converte centavos para string com 2 casas", () => {
        expect(fromStripeAmount(1000)).toBe("10.00")
        expect(fromStripeAmount(4990)).toBe("49.90")
        expect(fromStripeAmount(5)).toBe("0.05")
    })

    it("zero vira 0.00, não 0", () => {
        // amountMatches exige o formato exato com 2 casas (igual ao PayPal).
        expect(fromStripeAmount(0)).toBe("0.00")
    })
})
