import { describe, it, expect } from "vitest"
import { dadosDoVendedor, vendedorEstaConfigurado } from "./vendedor"

describe("dadosDoVendedor", () => {
    it("usa o que está configurado", () => {
        const vendedor = dadosDoVendedor({
            SELLER_NAME: "Easy Prospect Ltda.",
            SELLER_ADDRESS: "Rua X, 10 — 01000-000 São Paulo, Brasil",
            SELLER_TAX_ID: "CNPJ 00.000.000/0001-00",
            SELLER_EMAIL: "contato@easyprospect.com.br",
        })

        expect(vendedor).toEqual({
            nome: "Easy Prospect Ltda.",
            endereco: "Rua X, 10 — 01000-000 São Paulo, Brasil",
            documento: "CNPJ 00.000.000/0001-00",
            email: "contato@easyprospect.com.br",
        })
    })

    it("cai no remetente do sistema quando não há e-mail próprio do vendedor", () => {
        const vendedor = dadosDoVendedor({
            SELLER_NAME: "Easy Prospect",
            SMTP_FROM_EMAIL: "contato@easyprospect.com.br",
        })

        expect(vendedor.email).toBe("contato@easyprospect.com.br")
    })

    /**
     * Sem identificação nenhuma o comprovante ainda sai, com o nome do site.
     * Um documento sem quem vendeu vale pouco, mas vale mais que o comprador
     * não receber nada — e `vendedorEstaConfigurado` denuncia a lacuna.
     */
    it("não quebra sem configuração alguma", () => {
        const vendedor = dadosDoVendedor({})

        expect(vendedor.nome).toBe("Easy Prospect")
        expect(vendedor.endereco).toBeUndefined()
        expect(vendedor.documento).toBeUndefined()
    })

    it("ignora variável vazia como se não existisse", () => {
        const vendedor = dadosDoVendedor({ SELLER_NAME: "  ", SELLER_TAX_ID: "" })

        expect(vendedor.nome).toBe("Easy Prospect")
        expect(vendedor.documento).toBeUndefined()
    })
})

describe("vendedorEstaConfigurado", () => {
    it("exige nome e endereço, que é o mínimo para o comprador saber de quem comprou", () => {
        expect(vendedorEstaConfigurado({ SELLER_NAME: "Easy Prospect" })).toBe(false)
        expect(
            vendedorEstaConfigurado({ SELLER_NAME: "Easy Prospect", SELLER_ADDRESS: "Rua X, 10" })
        ).toBe(true)
    })
})
