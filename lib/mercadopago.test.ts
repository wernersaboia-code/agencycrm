import { describe, it, expect, vi, afterEach } from "vitest"
import { createHmac } from "node:crypto"
import {
    toMercadoPagoAmount,
    fromMercadoPagoAmount,
    verifyMercadoPagoSignature,
    MercadoPagoApiError,
    getPayment,
} from "./mercadopago"

describe("toMercadoPagoAmount", () => {
    it("mantém o valor decimal com 2 casas", () => {
        expect(toMercadoPagoAmount(10)).toBe(10)
        expect(toMercadoPagoAmount(289.9)).toBe(289.9)
    })

    it("elimina ruído de ponto flutuante", () => {
        // 0.1 + 0.2 = 0.30000000000000004 em IEEE-754.
        expect(toMercadoPagoAmount(0.1 + 0.2)).toBe(0.3)
    })

    it("arredonda para 2 casas — o Mercado Pago recusa mais que isso em BRL", () => {
        expect(toMercadoPagoAmount(12.345)).toBe(12.35)
        expect(toMercadoPagoAmount(12.344)).toBe(12.34)
    })
})

describe("fromMercadoPagoAmount", () => {
    it("converte para string com 2 casas, formato que amountMatches exige", () => {
        expect(fromMercadoPagoAmount(289.9)).toBe("289.90")
        expect(fromMercadoPagoAmount(10)).toBe("10.00")
    })

    it("zero vira 0.00, não 0", () => {
        expect(fromMercadoPagoAmount(0)).toBe("0.00")
    })
})

const SECRET = "segredo-de-teste"

function assinar(dataId: string, requestId: string, ts: string): string {
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
    return createHmac("sha256", SECRET).update(manifest).digest("hex")
}

describe("verifyMercadoPagoSignature", () => {
    it("aceita assinatura válida", () => {
        const ts = "1754179200"
        const v1 = assinar("123456", "req-1", ts)

        expect(
            verifyMercadoPagoSignature({
                signatureHeader: `ts=${ts},v1=${v1}`,
                requestId: "req-1",
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(true)
    })

    it("aceita o header com espaços entre as partes", () => {
        const ts = "1754179200"
        const v1 = assinar("123456", "req-1", ts)

        expect(
            verifyMercadoPagoSignature({
                signatureHeader: `ts=${ts}, v1=${v1}`,
                requestId: "req-1",
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(true)
    })

    it("normaliza o dataId para minúsculas", () => {
        // O Mercado Pago documenta que IDs alfanuméricos entram em minúsculas
        // no manifesto, mesmo quando chegam maiúsculos na query.
        const ts = "1754179200"
        const v1 = assinar("abc-def", "req-1", ts)

        expect(
            verifyMercadoPagoSignature({
                signatureHeader: `ts=${ts},v1=${v1}`,
                requestId: "req-1",
                dataId: "ABC-DEF",
                secret: SECRET,
            })
        ).toBe(true)
    })

    it("rejeita quando o ts foi adulterado", () => {
        const v1 = assinar("123456", "req-1", "1754179200")

        expect(
            verifyMercadoPagoSignature({
                signatureHeader: `ts=1754179999,v1=${v1}`,
                requestId: "req-1",
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita quando o dataId não é o assinado", () => {
        const ts = "1754179200"
        const v1 = assinar("123456", "req-1", ts)

        expect(
            verifyMercadoPagoSignature({
                signatureHeader: `ts=${ts},v1=${v1}`,
                requestId: "req-1",
                dataId: "999999",
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita header ausente", () => {
        expect(
            verifyMercadoPagoSignature({
                signatureHeader: null,
                requestId: "req-1",
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita header sem v1", () => {
        expect(
            verifyMercadoPagoSignature({
                signatureHeader: "ts=1754179200",
                requestId: "req-1",
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita request-id ausente", () => {
        const ts = "1754179200"
        const v1 = assinar("123456", "req-1", ts)

        expect(
            verifyMercadoPagoSignature({
                signatureHeader: `ts=${ts},v1=${v1}`,
                requestId: null,
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita v1 de tamanho diferente sem estourar", () => {
        // timingSafeEqual lança quando os buffers têm tamanhos diferentes —
        // a função precisa comparar tamanho antes.
        expect(
            verifyMercadoPagoSignature({
                signatureHeader: "ts=1754179200,v1=abc",
                requestId: "req-1",
                dataId: "123456",
                secret: SECRET,
            })
        ).toBe(false)
    })
})

describe("MercadoPagoApiError", () => {
    it("carrega o status HTTP, para o chamador distinguir permanente de transitório", () => {
        const erro = new MercadoPagoApiError(404, "/v1/payments/123456", '{"error":"not_found"}')

        expect(erro).toBeInstanceOf(Error)
        expect(erro.status).toBe(404)
        expect(erro.message).toContain("404")
        expect(erro.message).toContain("/v1/payments/123456")
        // O corpo continua na mensagem: é ele que diz a causa no log.
        expect(erro.message).toContain("not_found")
    })
})

describe("getPayment", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.unstubAllEnvs()
    })

    function responderCom(status: number, body: string) {
        vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "token-de-teste")
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: status >= 200 && status < 300,
                status,
                text: async () => body,
                json: async () => JSON.parse(body),
            })
        )
    }

    it("lança MercadoPagoApiError com status 404 quando o pagamento não existe", async () => {
        // É o caso do simulador do painel, que manda o id fictício 123456 — e
        // também o de qualquer notificação de outra conta.
        responderCom(404, '{"message":"Payment not found","error":"not_found"}')

        await expect(getPayment("123456")).rejects.toMatchObject({
            name: "MercadoPagoApiError",
            status: 404,
        })
    })

    it("preserva o status em falhas transitórias, que merecem reentrega", async () => {
        responderCom(503, '{"message":"Service Unavailable"}')

        await expect(getPayment("123456")).rejects.toMatchObject({ status: 503 })
    })

    it("devolve o pagamento normalizado quando a chamada dá certo", async () => {
        responderCom(
            200,
            JSON.stringify({
                id: 987654,
                status: "approved",
                transaction_amount: 289.9,
                currency_id: "BRL",
                external_reference: "compra-1",
                payer: { email: "comprador@teste.com", first_name: "Ana", last_name: "Silva" },
            })
        )

        await expect(getPayment("987654")).resolves.toEqual({
            id: "987654",
            status: "approved",
            transactionAmount: 289.9,
            currencyId: "BRL",
            externalReference: "compra-1",
            payerEmail: "comprador@teste.com",
            payerName: "Ana Silva",
        })
    })
})
