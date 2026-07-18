import { describe, it, expect } from "vitest"
import { amountMatches } from "./fulfillment"

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
