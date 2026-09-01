import { describe, it, expect } from "vitest"
import { montarComprovante, numeroDoComprovante } from "./comprovante"

const compra = {
    id: "cmsgsu0a9x7k2p1q4h8e3v6b",
    provider: "stripe",
    status: "paid",
    total: 49.9,
    currency: "EUR",
    buyerEmail: "cliente@empresa.de",
    buyerName: null,
    buyerTaxId: null,
    paidAt: new Date("2026-08-20T14:30:00Z"),
    createdAt: new Date("2026-08-20T14:25:00Z"),
    user: { name: "Klaus Meier", email: "klaus@empresa.de" },
    items: [{ price: 49.9, list: { name: "HoReCa & Foodservice Market - Germany" } }],
}

describe("numeroDoComprovante", () => {
    /**
     * O mesmo prefixo de oito caracteres que o e-mail de confirmação já mostra
     * como número do pedido. Dois números diferentes para a mesma compra é o
     * tipo de coisa que faz o comprador abrir chamado.
     */
    it("repete o número curto que o e-mail de confirmação usa", () => {
        expect(numeroDoComprovante("cmsgsu0a9x7k2p1q4h8e3v6b")).toBe("CMSGSU0A")
    })
})

describe("montarComprovante", () => {
    it("traz número, datas, itens e total", () => {
        const dados = montarComprovante(compra)

        expect(dados.numero).toBe("CMSGSU0A")
        expect(dados.pagoEm).toEqual(new Date("2026-08-20T14:30:00Z"))
        expect(dados.total).toBe(49.9)
        expect(dados.moeda).toBe("EUR")
        expect(dados.itens).toEqual([
            { nome: "HoReCa & Foodservice Market - Germany", preco: 49.9 },
        ])
    })

    it("prefere o nome do snapshot da compra ao nome atual da conta", () => {
        expect(montarComprovante({ ...compra, buyerName: "Klaus Meier GmbH" }).comprador.nome).toBe(
            "Klaus Meier GmbH"
        )
        expect(montarComprovante(compra).comprador.nome).toBe("Klaus Meier")
    })

    it("usa o e-mail do snapshot, que é para onde a compra foi confirmada", () => {
        expect(montarComprovante(compra).comprador.email).toBe("cliente@empresa.de")
        expect(montarComprovante({ ...compra, buyerEmail: null }).comprador.email).toBe(
            "klaus@empresa.de"
        )
    })

    /**
     * Compra antiga pode não ter `paidAt` — o campo passou a ser preenchido
     * depois de as primeiras compras existirem. Sem data o comprovante não
     * serve para nada, então cai na criação em vez de sair vazio.
     */
    it("cai na data de criação quando não há data de pagamento", () => {
        expect(montarComprovante({ ...compra, paidAt: null }).pagoEm).toEqual(
            new Date("2026-08-20T14:25:00Z")
        )
    })

    it("aceita Decimal do Prisma, que chega como objeto e não como número", () => {
        const decimal = { toString: () => "49.90" }
        const dados = montarComprovante({
            ...compra,
            total: decimal as never,
            items: [{ price: decimal as never, list: { name: "Estudo" } }],
        })

        expect(dados.total).toBe(49.9)
        expect(dados.itens[0].preco).toBe(49.9)
    })

    it("recusa compra não paga: comprovante de compra não confirmada é documento falso", () => {
        expect(() => montarComprovante({ ...compra, status: "pending" })).toThrow(/paga/i)
    })
})
