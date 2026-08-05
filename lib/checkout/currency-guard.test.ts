import { describe, it, expect } from "vitest"
import { providerForCurrency } from "./currency-guard"

describe("providerForCurrency", () => {
    it("BRL vai para o Mercado Pago, que é quem tem Pix", () => {
        expect(providerForCurrency("BRL")).toBe("mercadopago")
    })

    it("EUR e USD vão para o Paddle", () => {
        expect(providerForCurrency("EUR")).toBe("paddle")
        expect(providerForCurrency("USD")).toBe("paddle")
    })

    it("moeda desconhecida cai no Paddle, não no Mercado Pago", () => {
        // O Mercado Pago só cobra em BRL; mandar outra moeda para ele cobraria
        // o número em reais sem erro de API. O Paddle recusa moeda que não
        // suporta, com erro. Errar para o lado que reclama é mais seguro.
        expect(providerForCurrency("GBP")).toBe("paddle")
    })
})
