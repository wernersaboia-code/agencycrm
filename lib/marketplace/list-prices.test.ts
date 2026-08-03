import { describe, it, expect, vi } from "vitest"
import { pickPrice, resolveListPrices, writeListPrices, cartCurrencyFor, roundCommercial } from "./list-prices"

describe("pickPrice", () => {
    const prices = [
        { currency: "EUR", amount: "45.00" },
        { currency: "BRL", amount: "289.00" },
    ]

    it("devolve o preço da moeda pedida", () => {
        expect(pickPrice(prices, "BRL")).toEqual({ amount: 289, currency: "BRL", isFallback: false })
    })

    it("cai para EUR quando a moeda pedida não tem preço, e marca o fallback", () => {
        expect(pickPrice(prices, "USD")).toEqual({ amount: 45, currency: "EUR", isFallback: true })
    })

    it("devolve null quando nem EUR existe — lista sem preço não tem o que exibir", () => {
        expect(pickPrice([{ currency: "BRL", amount: "289.00" }], "USD")).toBeNull()
    })

    it("aceita Decimal, number e string como veio do banco", () => {
        expect(pickPrice([{ currency: "EUR", amount: 45 }], "EUR")?.amount).toBe(45)
        expect(pickPrice([{ currency: "EUR", amount: "45.50" }], "EUR")?.amount).toBe(45.5)
    })

    it("ignora moeda desconhecida guardada no banco", () => {
        const comLixo = [{ currency: "GBP", amount: "30.00" }, { currency: "EUR", amount: "45.00" }]
        expect(pickPrice(comLixo, "EUR")).toEqual({ amount: 45, currency: "EUR", isFallback: false })
    })
})

describe("resolveListPrices", () => {
    function createMockDb(rows: Array<{ listId: string; currency: string; amount: string }>) {
        return {
            leadListPrice: {
                findMany: vi.fn().mockResolvedValue(rows),
            },
        }
    }

    it("devolve um preço por lista, na moeda pedida", async () => {
        const db = createMockDb([
            { listId: "a", currency: "EUR", amount: "45.00" },
            { listId: "a", currency: "BRL", amount: "289.00" },
            { listId: "b", currency: "EUR", amount: "20.00" },
        ])

        const result = await resolveListPrices(db as never, ["a", "b"], "BRL")

        expect(result.get("a")).toEqual({ amount: 289, currency: "BRL", isFallback: false })
        expect(result.get("b")).toEqual({ amount: 20, currency: "EUR", isFallback: true })
    })

    it("omite do mapa a lista sem nenhum preço", async () => {
        const db = createMockDb([])
        const result = await resolveListPrices(db as never, ["a"], "EUR")
        expect(result.has("a")).toBe(false)
    })

    it("não consulta o banco com lista de ids vazia", async () => {
        const db = createMockDb([])
        const result = await resolveListPrices(db as never, [], "EUR")
        expect(result.size).toBe(0)
        expect(db.leadListPrice.findMany).not.toHaveBeenCalled()
    })
})

describe("writeListPrices", () => {
    function createMockDb() {
        const tx = {
            leadListPrice: { upsert: vi.fn(), deleteMany: vi.fn() },
            leadList: { update: vi.fn() },
        }
        return {
            tx,
            db: { $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)) },
        }
    }

    it("grava cada moeda informada e espelha o EUR em LeadList.price", async () => {
        const { db, tx } = createMockDb()

        await writeListPrices(db as never, "list-1", { EUR: 45, BRL: 289 })

        expect(tx.leadListPrice.upsert).toHaveBeenCalledTimes(2)
        expect(tx.leadList.update).toHaveBeenCalledWith({
            where: { id: "list-1" },
            data: { price: 45, currency: "EUR" },
        })
    })

    it("recusa gravar sem EUR — é a moeda obrigatória", async () => {
        const { db } = createMockDb()
        await expect(writeListPrices(db as never, "list-1", { BRL: 289 })).rejects.toThrow(/EUR/)
    })

    it("recusa valor não positivo", async () => {
        const { db } = createMockDb()
        await expect(
            writeListPrices(db as never, "list-1", { EUR: 0, BRL: 289 })
        ).rejects.toThrow(/positivo/)
    })

    it("apaga a linha da moeda opcional cujo valor foi enviado como undefined", async () => {
        const { db, tx } = createMockDb()

        // USD continua opcional — EUR e BRL, os obrigatórios, sempre vão aqui.
        await writeListPrices(db as never, "list-1", { EUR: 45, BRL: 289, USD: undefined })

        expect(tx.leadListPrice.deleteMany).toHaveBeenCalledWith({
            where: { listId: "list-1", currency: { in: ["USD"] } },
        })
    })
})

describe("writeListPrices — moedas obrigatórias", () => {
    function createMockDb() {
        return {
            leadListPrice: { upsert: vi.fn(), deleteMany: vi.fn() },
            leadList: { update: vi.fn() },
            $transaction: vi.fn(),
        }
    }

    it("recusa lista sem preço em BRL", async () => {
        const db = createMockDb()

        await expect(
            writeListPrices(db as never, "lista-1", { EUR: 45 })
        ).rejects.toThrow(/BRL/)

        expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("recusa lista sem preço em EUR", async () => {
        const db = createMockDb()

        await expect(
            writeListPrices(db as never, "lista-1", { BRL: 289 })
        ).rejects.toThrow(/EUR/)

        expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("aceita EUR e BRL, com USD opcional", async () => {
        const db = createMockDb()
        db.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
            await fn({
                leadListPrice: { upsert: vi.fn(), deleteMany: vi.fn() },
                leadList: { update: vi.fn() },
            })
        })

        await expect(
            writeListPrices(db as never, "lista-1", { EUR: 45, BRL: 289 })
        ).resolves.toBeUndefined()

        expect(db.$transaction).toHaveBeenCalled()
    })
})

describe("cartCurrencyFor", () => {
    it("mantém a moeda pedida quando todos os itens têm preço nela", () => {
        const prices = new Map([
            ["a", { amount: 289, currency: "BRL" as const, isFallback: false }],
            ["b", { amount: 129, currency: "BRL" as const, isFallback: false }],
        ])
        expect(cartCurrencyFor(prices, "BRL")).toEqual({ currency: "BRL", fellBack: false })
    })

    it("derruba o carrinho INTEIRO para EUR se um único item não tem preço na moeda", () => {
        const prices = new Map([
            ["a", { amount: 289, currency: "BRL" as const, isFallback: false }],
            ["b", { amount: 20, currency: "EUR" as const, isFallback: true }],
        ])
        expect(cartCurrencyFor(prices, "BRL")).toEqual({ currency: "EUR", fellBack: true })
    })

    it("carrinho vazio fica na moeda pedida", () => {
        expect(cartCurrencyFor(new Map(), "USD")).toEqual({ currency: "USD", fellBack: false })
    })
})

describe("roundCommercial", () => {
    it("real arredonda para o 9 acima da dezena", () => {
        expect(roundCommercial(232.5, "BRL")).toBe(239)
        expect(roundCommercial(240, "BRL")).toBe(249)
    })

    it("dólar e euro arredondam para o 9 acima da unidade", () => {
        expect(roundCommercial(46.2, "USD")).toBe(49)
        expect(roundCommercial(21.4, "EUR")).toBe(29)
    })

    it("nunca devolve valor menor que a entrada", () => {
        expect(roundCommercial(289, "BRL")).toBeGreaterThanOrEqual(289)
    })
})
