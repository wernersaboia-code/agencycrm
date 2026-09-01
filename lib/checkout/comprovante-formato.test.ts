import { describe, it, expect } from "vitest"
import { formatarComprovante, nomeDoProvedor } from "./comprovante-formato"
import type { DadosComprovante } from "./comprovante"

const dados: DadosComprovante = {
    numero: "CMSGSU0A",
    pagoEm: new Date("2026-08-20T14:30:00Z"),
    provedor: "stripe",
    comprador: { nome: "Klaus Meier", email: "klaus@empresa.de", documento: undefined },
    itens: [{ nome: "HoReCa & Foodservice Market - Germany", preco: 49.9 }],
    total: 49.9,
    moeda: "EUR",
    vendedor: {
        nome: "Easy Prospect",
        endereco: "Rua X, 10 — São Paulo, Brasil",
        documento: "CNPJ 00.000.000/0001-00",
        email: "contato@easyprospect.com.br",
    },
}

describe("formatarComprovante", () => {
    /**
     * "de" sozinho não define separador decimal nem formato de data — o mesmo
     * motivo pelo qual o e-mail de confirmação usa a tag BCP 47 completa.
     */
    it("formata data e dinheiro no padrão do idioma do comprador", () => {
        const alemao = formatarComprovante(dados, "de")
        // O separador que o Intl usa antes do símbolo é espaço NÃO separável
        // (U+00A0), não espaço comum: escrito à mão, o teste falha por um
        // caractere invisível.
        expect(alemao.total).toBe("49,90 €")
        expect(alemao.data).toBe("20.08.2026")

        const ingles = formatarComprovante(dados, "en")
        expect(ingles.total).toBe("€49.90")
    })

    it("monta o bloco do vendedor pulando o que não está configurado", () => {
        expect(formatarComprovante(dados, "pt").vendedor).toEqual([
            "Easy Prospect",
            "Rua X, 10 — São Paulo, Brasil",
            "CNPJ 00.000.000/0001-00",
            "contato@easyprospect.com.br",
        ])

        const semEndereco = formatarComprovante(
            { ...dados, vendedor: { nome: "Easy Prospect" } },
            "pt"
        )
        expect(semEndereco.vendedor).toEqual(["Easy Prospect"])
    })

    it("mostra o documento do comprador só quando ele informou um", () => {
        expect(formatarComprovante(dados, "pt").comprador).toEqual([
            "Klaus Meier",
            "klaus@empresa.de",
        ])

        const comDocumento = formatarComprovante(
            { ...dados, comprador: { ...dados.comprador, documento: "DE123456789" } },
            "pt"
        )
        expect(comDocumento.comprador).toContain("DE123456789")
    })
})

describe("nomeDoProvedor", () => {
    it("mostra o nome comercial, não o identificador interno", () => {
        expect(nomeDoProvedor("mercadopago")).toBe("Mercado Pago")
        expect(nomeDoProvedor("stripe")).toBe("Stripe")
    })

    it("devolve o próprio valor quando o provedor é desconhecido", () => {
        expect(nomeDoProvedor("boleto")).toBe("boleto")
    })
})
