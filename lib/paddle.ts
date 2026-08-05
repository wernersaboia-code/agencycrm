// lib/paddle.ts
//
// Cliente do Paddle e conversões de valor.
//
// Cliente fino sobre fetch, não o SDK oficial: são dois endpoints, e a mesma
// razão do Mercado Pago vale aqui — não vale acoplar o caminho do dinheiro a
// uma dependência a mais.
//
// O Paddle trabalha com a MENOR UNIDADE da moeda, como o Stripe, e a expressa
// como STRING (não número). A conversão aqui é de escala, e o resultado é
// string de propósito: é o que a API espera receber e devolve.

import { createHmac, timingSafeEqual } from "node:crypto"
import { getPaddleServerConfig } from "@/lib/server-env"
import { getPublicPaddleEnv } from "@/lib/env"

/** A presença da API key é o que habilita o provedor no servidor. */
export function isPaddleConfigured(): boolean {
    return Boolean(process.env.PADDLE_API_KEY)
}

function apiBase(): string {
    return getPublicPaddleEnv() === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com"
}

/** Decimal do domínio (45) → unidade mínima em string ("4500"). */
export function toPaddleAmount(value: number): string {
    return String(Math.round(value * 100))
}

/** Unidade mínima do Paddle ("4500") → string com 2 casas ("45.00"), formato que `amountMatches` exige. */
export function fromPaddleAmount(minorUnits: string): string {
    return (Number(minorUnits) / 100).toFixed(2)
}

/**
 * Verifica a assinatura do webhook.
 *
 * O header é `Paddle-Signature: ts=<unix>;h1=<hex>` e o manifesto é
 * `ts:corpo_cru`, com HMAC-SHA256.
 *
 * O `rawBody` precisa ser exatamente o que chegou na requisição. Reserializar
 * o JSON — mesmo sem mudar o significado — muda os bytes e derruba a
 * verificação.
 *
 * Pura de propósito: é a peça de segurança do fluxo e precisa ser testável sem
 * rede nem servidor.
 */
export function verifyPaddleSignature(params: {
    signatureHeader: string | null
    rawBody: string
    secret: string
}): boolean {
    const { signatureHeader, rawBody, secret } = params

    if (!signatureHeader) {
        return false
    }

    let ts: string | undefined
    let h1: string | undefined

    for (const part of signatureHeader.split(";")) {
        const separator = part.indexOf("=")
        if (separator === -1) continue

        const key = part.slice(0, separator).trim()
        const value = part.slice(separator + 1).trim()

        if (key === "ts") ts = value
        if (key === "h1") h1 = value
    }

    if (!ts || !h1) {
        return false
    }

    const expected = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex")

    // timingSafeEqual lança quando os tamanhos diferem — comparar antes.
    if (expected.length !== h1.length) {
        return false
    }

    return timingSafeEqual(Buffer.from(expected), Buffer.from(h1))
}

/**
 * Erro de uma chamada à API do Paddle, com o status HTTP preservado.
 *
 * Mesmo motivo do `MercadoPagoApiError`: o status separa falha permanente de
 * transitória, e é essa distinção que decide se o webhook pede reentrega.
 */
export class PaddleApiError extends Error {
    constructor(
        readonly status: number,
        readonly path: string,
        readonly body: string
    ) {
        super(`Paddle ${status} em ${path}: ${body}`)
        this.name = "PaddleApiError"
    }
}

export type CreateTransactionInput = {
    items: Array<{ name: string; description: string; quantity: number; unitPrice: number }>
    currencyCode: string
    /** Nosso purchase.id — é ele que amarra a transação ao pedido. */
    purchaseId: string
    customerEmail: string
}

export type PaddleTransaction = {
    id: string
    status: string
    grandTotal: string | null
    currencyCode: string | null
    purchaseId: string | null
    customerEmail: string | null
}

async function paddleFetch(path: string, init?: RequestInit): Promise<unknown> {
    const { apiKey } = getPaddleServerConfig()

    const response = await fetch(`${apiBase()}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...init?.headers,
        },
    })

    if (!response.ok) {
        // O corpo do erro traz a causa (moeda inválida, tax_mode recusado). Sem
        // ele, todo problema de integração vira "500" sem pista.
        const body = await response.text()
        throw new PaddleApiError(response.status, path, body)
    }

    return response.json()
}

/**
 * Cria a transação com preços NÃO-CATÁLOGO.
 *
 * `tax_mode: "internal"` é a linha que faz o fluxo funcionar. Como Merchant of
 * Record o Paddle cobra o IVA; sem imposto por dentro, o `grand_total` volta
 * como preço + IVA e `amountMatches` reprova TODA compra internacional — o
 * sintoma seria compra paga que nunca libera o download.
 *
 * Sem catálogo no Paddle de propósito: o preço sai do nosso banco, fonte de
 * verdade única. Espelhar as listas lá criaria duas, e o dia em que
 * divergissem o comprador pagaria o valor errado.
 */
export async function createTransaction(
    input: CreateTransactionInput
): Promise<{ id: string }> {
    const body = {
        items: input.items.map((item) => ({
            quantity: item.quantity,
            price: {
                name: item.name,
                description: item.description,
                tax_mode: "internal",
                unit_price: {
                    amount: toPaddleAmount(item.unitPrice),
                    currency_code: input.currencyCode,
                },
                product: {
                    name: item.name,
                    tax_category: "standard",
                },
            },
        })),
        currency_code: input.currencyCode,
        collection_mode: "automatic",
        custom_data: { purchaseId: input.purchaseId },
        customer: { email: input.customerEmail },
    }

    const data = (await paddleFetch("/transactions", {
        method: "POST",
        body: JSON.stringify(body),
    })) as { data?: { id?: string } }

    if (!data.data?.id) {
        throw new Error("Paddle devolveu transação sem id")
    }

    return { id: data.data.id }
}

/**
 * Busca uma transação. O webhook já traz o corpo completo, mas a rota de
 * confirmação precisa consultar por conta própria — e conferir o valor contra
 * a fonte, em vez de contra o que o cliente afirmou.
 */
export async function getTransaction(transactionId: string): Promise<PaddleTransaction> {
    const payload = (await paddleFetch(`/transactions/${transactionId}`)) as {
        data?: {
            id?: string
            status?: string
            currency_code?: string
            custom_data?: { purchaseId?: string }
            details?: { totals?: { grand_total?: string } }
            customer?: { email?: string }
        }
    }

    const data = payload.data ?? {}

    return {
        id: data.id ?? transactionId,
        status: data.status ?? "unknown",
        grandTotal: data.details?.totals?.grand_total ?? null,
        currencyCode: data.currency_code ?? null,
        purchaseId: data.custom_data?.purchaseId ?? null,
        customerEmail: data.customer?.email ?? null,
    }
}
