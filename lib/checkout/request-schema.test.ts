import { describe, it, expect } from "vitest"
import { checkoutRequestSchema } from "./request-schema"

describe("checkoutRequestSchema", () => {
    const valido = { items: [{ listId: "abc", quantity: 1 }], currency: "BRL" }

    it("aceita item e moeda suportada", () => {
        const parsed = checkoutRequestSchema.safeParse(valido)
        expect(parsed.success).toBe(true)
    })

    it("recusa moeda fora de SUPPORTED_CURRENCIES — vira 400, não queda para euro", () => {
        expect(checkoutRequestSchema.safeParse({ ...valido, currency: "GBP" }).success).toBe(false)
    })

    it("recusa corpo sem moeda", () => {
        expect(checkoutRequestSchema.safeParse({ items: valido.items }).success).toBe(false)
    })

    it("descarta preço enviado pelo cliente — o valor cobrado sai do banco", () => {
        const parsed = checkoutRequestSchema.parse({
            items: [{ listId: "abc", quantity: 1, price: 0.01 }],
            currency: "EUR",
            total: 0.01,
        })

        expect(parsed.items[0]).toEqual({ listId: "abc", quantity: 1 })
        expect(parsed).not.toHaveProperty("total")
    })

    it("recusa carrinho vazio", () => {
        expect(checkoutRequestSchema.safeParse({ items: [], currency: "EUR" }).success).toBe(false)
    })
})
