import { describe, it, expect, vi, afterEach } from "vitest"
import { createHmac } from "node:crypto"
import {
    toPaddleAmount,
    fromPaddleAmount,
    verifyPaddleSignature,
    PaddleApiError,
    getTransaction,
    createTransaction,
} from "./paddle"

describe("toPaddleAmount", () => {
    it("converte decimal do domínio para unidade mínima em string", () => {
        expect(toPaddleAmount(45)).toBe("4500")
        expect(toPaddleAmount(289.9)).toBe("28990")
    })

    it("elimina ruído de ponto flutuante", () => {
        // 0.1 + 0.2 = 0.30000000000000004 em IEEE-754.
        expect(toPaddleAmount(0.1 + 0.2)).toBe("30")
    })

    it("arredonda para a unidade mínima mais próxima", () => {
        expect(toPaddleAmount(12.345)).toBe("1235")
        expect(toPaddleAmount(12.344)).toBe("1234")
    })
})

describe("fromPaddleAmount", () => {
    it("converte unidade mínima para o formato que amountMatches exige", () => {
        expect(fromPaddleAmount("4500")).toBe("45.00")
        expect(fromPaddleAmount("28990")).toBe("289.90")
    })

    it("zero vira 0.00", () => {
        expect(fromPaddleAmount("0")).toBe("0.00")
    })
})

const SECRET = "segredo-de-teste"

function assinar(rawBody: string, ts: string): string {
    return createHmac("sha256", SECRET).update(`${ts}:${rawBody}`).digest("hex")
}

describe("verifyPaddleSignature", () => {
    const CORPO = '{"event_type":"transaction.completed","data":{"id":"txn_1"}}'

    it("aceita assinatura válida", () => {
        const ts = "1785940000"
        const h1 = assinar(CORPO, ts)

        expect(
            verifyPaddleSignature({
                signatureHeader: `ts=${ts};h1=${h1}`,
                rawBody: CORPO,
                secret: SECRET,
            })
        ).toBe(true)
    })

    it("rejeita quando o corpo foi reformatado", () => {
        // A razão de o webhook ler o corpo CRU: reserializar muda o byte a byte
        // e derruba a assinatura, sem mudar o significado do JSON.
        const ts = "1785940000"
        const h1 = assinar(CORPO, ts)
        const reformatado = JSON.stringify(JSON.parse(CORPO), null, 2)

        expect(
            verifyPaddleSignature({
                signatureHeader: `ts=${ts};h1=${h1}`,
                rawBody: reformatado,
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita quando o ts foi adulterado", () => {
        const h1 = assinar(CORPO, "1785940000")

        expect(
            verifyPaddleSignature({
                signatureHeader: `ts=1785949999;h1=${h1}`,
                rawBody: CORPO,
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita header ausente", () => {
        expect(
            verifyPaddleSignature({ signatureHeader: null, rawBody: CORPO, secret: SECRET })
        ).toBe(false)
    })

    it("rejeita header sem h1", () => {
        expect(
            verifyPaddleSignature({
                signatureHeader: "ts=1785940000",
                rawBody: CORPO,
                secret: SECRET,
            })
        ).toBe(false)
    })

    it("rejeita h1 de tamanho diferente sem estourar", () => {
        // timingSafeEqual lança quando os buffers têm tamanhos diferentes —
        // a função precisa comparar tamanho antes.
        expect(
            verifyPaddleSignature({
                signatureHeader: "ts=1785940000;h1=abc",
                rawBody: CORPO,
                secret: SECRET,
            })
        ).toBe(false)
    })
})

describe("PaddleApiError", () => {
    it("carrega o status HTTP, para o chamador distinguir permanente de transitório", () => {
        const erro = new PaddleApiError(404, "/transactions/txn_1", '{"error":"not_found"}')

        expect(erro).toBeInstanceOf(Error)
        expect(erro.status).toBe(404)
        expect(erro.message).toContain("404")
        expect(erro.message).toContain("/transactions/txn_1")
    })
})

describe("getTransaction", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.unstubAllEnvs()
    })

    function responderCom(status: number, body: string) {
        vi.stubEnv("PADDLE_API_KEY", "chave-de-teste")
        const fetchMock = vi.fn().mockResolvedValue({
            ok: status >= 200 && status < 300,
            status,
            text: async () => body,
            json: async () => JSON.parse(body),
        })
        vi.stubGlobal("fetch", fetchMock)
        return fetchMock
    }

    it("lança PaddleApiError com status 404 quando a transação não existe", async () => {
        responderCom(404, '{"error":{"code":"not_found"}}')

        await expect(getTransaction("txn_inexistente")).rejects.toMatchObject({
            name: "PaddleApiError",
            status: 404,
        })
    })

    it("devolve a transação normalizada, com o purchaseId vindo de custom_data", async () => {
        responderCom(
            200,
            JSON.stringify({
                data: {
                    id: "txn_1",
                    status: "completed",
                    currency_code: "EUR",
                    custom_data: { purchaseId: "compra-1" },
                    details: { totals: { grand_total: "4500" } },
                },
            })
        )

        await expect(getTransaction("txn_1")).resolves.toEqual({
            id: "txn_1",
            status: "completed",
            grandTotal: "4500",
            currencyCode: "EUR",
            purchaseId: "compra-1",
        })
    })

    it("não pede include=customer — evita exigir permissão que a chave não tem", async () => {
        // A chave é criada com o mínimo de permissões. `include=customer`
        // exigiria `customer:read` e devolve 403 sem ela — foi o que deixou a
        // primeira compra de teste pendente, com o pagamento já feito.
        responderCom(200, JSON.stringify({ data: { id: "txn_3", status: "completed" } }))

        await getTransaction("txn_3")

        const [url] = (globalThis.fetch as unknown as { mock: { calls: [string][] } }).mock.calls[0]
        expect(url).not.toContain("include=")
    })

    it("não estoura quando custom_data vem ausente", async () => {
        responderCom(
            200,
            JSON.stringify({
                data: { id: "txn_2", status: "ready", currency_code: "USD", details: { totals: {} } },
            })
        )

        await expect(getTransaction("txn_2")).resolves.toMatchObject({
            purchaseId: null,
            grandTotal: null,
        })
    })
})

describe("createTransaction", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.unstubAllEnvs()
    })

    it("monta o corpo com tax_mode internal, valor em unidade mínima e sem campo customer", async () => {
        vi.stubEnv("PADDLE_API_KEY", "chave-de-teste")
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: async () => "",
            json: async () => ({ data: { id: "txn_novo" } }),
        })
        vi.stubGlobal("fetch", fetchMock)

        await createTransaction({
            items: [
                { name: "Lista A", description: "Lista A", quantity: 1, unitPrice: 45 },
                { name: "Lista B", description: "Lista B", quantity: 2, unitPrice: 12.5 },
            ],
            currencyCode: "EUR",
            purchaseId: "compra-1",
        })

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
        const body = JSON.parse(init.body as string)

        expect(body.custom_data).toEqual({ purchaseId: "compra-1" })
        expect(body.customer).toBeUndefined()

        for (const item of body.items) {
            expect(item.price.tax_mode).toBe("internal")
            expect(item.price.unit_price.currency_code).toBe("EUR")
        }

        expect(body.items[0].price.unit_price.amount).toBe("4500")
        expect(body.items[1].price.unit_price.amount).toBe("1250")
    })
})
