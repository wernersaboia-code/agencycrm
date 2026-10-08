import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({ prisma: {} }))

import { formatarReceita, formatarTicketMedio, ordenarReceitas } from "./receita"

const RECEITAS = [
    { currency: "BRL", total: 1, vendas: 1 },
    { currency: "EUR", total: 55, vendas: 2 },
]

describe("receita por moeda", () => {
    it("não soma moedas diferentes", () => {
        const texto = formatarReceita(ordenarReceitas(RECEITAS))
        expect(texto).toContain("55,00")
        expect(texto).toContain("R$")
        expect(texto).not.toContain("56")
    })

    it("põe o euro primeiro", () => {
        expect(ordenarReceitas(RECEITAS).map((receita) => receita.currency)).toEqual(["EUR", "BRL"])
    })

    it("calcula o ticket médio dentro de cada moeda", () => {
        const texto = formatarTicketMedio(ordenarReceitas(RECEITAS))
        expect(texto).toContain("27,50")
        expect(texto).toContain("1,00")
    })

    it("sem vendas mostra zero em euro", () => {
        expect(formatarReceita([])).toContain("0,00")
        expect(formatarTicketMedio([])).toContain("0,00")
    })
})
