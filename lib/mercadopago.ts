// lib/mercadopago.ts
//
// Cliente do Mercado Pago e conversões de valor.
//
// Cliente fino sobre fetch, não o SDK oficial: são dois endpoints, e o SDK do
// Mercado Pago tem histórico de tipagem instável — não vale acoplar o caminho
// do dinheiro a isso.
//
// Diferença importante em relação ao Stripe: o Mercado Pago trabalha com
// DECIMAL, não com a menor unidade da moeda. A conversão aqui é de
// arredondamento, não de escala.

import { createHmac, timingSafeEqual } from "node:crypto"
import { getMercadoPagoServerConfig } from "@/lib/server-env"

const API_BASE = "https://api.mercadopago.com"

/** A presença do access token é o que habilita o provedor no servidor. */
export function isMercadoPagoConfigured(): boolean {
    return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN)
}

/**
 * Decimal do domínio → decimal do Mercado Pago, com 2 casas.
 *
 * O arredondamento existe por dois motivos: o BRL não tem fração menor que o
 * centavo, e somas de ponto flutuante produzem caudas (0.1 + 0.2) que a API
 * recusa.
 */
export function toMercadoPagoAmount(value: number): number {
    return Math.round(value * 100) / 100
}

/** Valor do Mercado Pago → string com 2 casas, formato que `amountMatches` exige. */
export function fromMercadoPagoAmount(amount: number): string {
    return amount.toFixed(2)
}

/**
 * Verifica a assinatura do webhook.
 *
 * O manifesto é `id:{data.id};request-id:{x-request-id};ts:{ts};` e o hash é
 * HMAC-SHA256 em hex, comparado com o campo `v1` do header `x-signature`.
 *
 * Pura de propósito: é a peça de segurança do fluxo e precisa ser testável sem
 * rede nem servidor.
 */
export function verifyMercadoPagoSignature(params: {
    signatureHeader: string | null
    requestId: string | null
    dataId: string
    secret: string
}): boolean {
    const { signatureHeader, requestId, dataId, secret } = params

    if (!signatureHeader || !requestId) {
        return false
    }

    let ts: string | undefined
    let v1: string | undefined

    for (const part of signatureHeader.split(",")) {
        const separator = part.indexOf("=")
        if (separator === -1) continue

        const key = part.slice(0, separator).trim()
        const value = part.slice(separator + 1).trim()

        if (key === "ts") ts = value
        if (key === "v1") v1 = value
    }

    if (!ts || !v1) {
        return false
    }

    // O Mercado Pago documenta o ID em minúsculas no manifesto quando é
    // alfanumérico. Normalizar sempre é seguro: ID numérico não muda.
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`
    const expected = createHmac("sha256", secret).update(manifest).digest("hex")

    // timingSafeEqual lança quando os tamanhos diferem — comparar antes.
    if (expected.length !== v1.length) {
        return false
    }

    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
}

export type CreatePreferenceInput = {
    items: Array<{ id: string; title: string; quantity: number; unitPrice: number }>
    payerEmail: string
    /** Nosso purchase.id — é ele que amarra o pagamento ao pedido. */
    externalReference: string
    successUrl: string
    pendingUrl: string
    failureUrl: string
    notificationUrl: string
}

export type MercadoPagoPayment = {
    id: string
    status: string
    transactionAmount: number | null
    currencyId: string | null
    externalReference: string | null
    payerEmail: string | null
    payerName: string | null
}

/**
 * Erro de uma chamada à API do Mercado Pago, com o status HTTP preservado.
 *
 * O status é o que separa falha permanente de transitória, e essa distinção
 * decide se o webhook pede reentrega ou não. Sem ele, o chamador teria que ler
 * o número de dentro da mensagem — o tipo de acoplamento que quebra calado no
 * dia em que o texto mudar.
 */
export class MercadoPagoApiError extends Error {
    constructor(
        readonly status: number,
        readonly path: string,
        readonly body: string
    ) {
        super(`Mercado Pago ${status} em ${path}: ${body}`)
        this.name = "MercadoPagoApiError"
    }
}

async function mercadoPagoFetch(path: string, init?: RequestInit): Promise<unknown> {
    const { accessToken } = getMercadoPagoServerConfig()

    const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...init?.headers,
        },
    })

    if (!response.ok) {
        // O corpo do erro traz a causa (moeda inválida, item sem preço). Sem
        // ele, todo problema de integração vira "500" sem pista.
        const body = await response.text()
        throw new MercadoPagoApiError(response.status, path, body)
    }

    return response.json()
}

/**
 * Cria a preferência do Checkout Pro.
 *
 * `currency_id` é sempre BRL: a conta é brasileira e o Mercado Pago NÃO
 * converte — mandar outro código de moeda cobraria o mesmo número em reais,
 * sem erro de API.
 *
 * Os meios de pagamento não são listados, apenas excluídos: método novo que o
 * Mercado Pago lançar entra sozinho, em vez de sumir sem ninguém notar. Boleto
 * (`ticket`) fica de fora — 3 dias úteis de compensação não combinam com
 * produto de entrega imediata.
 */
export async function createPreference(
    input: CreatePreferenceInput
): Promise<{ id: string; initPoint: string }> {
    const body = {
        items: input.items.map((item) => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            unit_price: toMercadoPagoAmount(item.unitPrice),
            currency_id: "BRL",
        })),
        payer: { email: input.payerEmail },
        external_reference: input.externalReference,
        back_urls: {
            success: input.successUrl,
            pending: input.pendingUrl,
            failure: input.failureUrl,
        },
        notification_url: input.notificationUrl,
        payment_methods: {
            excluded_payment_types: [{ id: "ticket" }],
        },
        // Sem `auto_return` o Checkout Pro não devolve o comprador para o site:
        // ele para na tela do Mercado Pago com um botão manual, e a página de
        // retorno — o caminho rápido de confirmação — quase nunca é alcançada.
        //
        // Condicional de propósito, não por descuido: o Mercado Pago RECUSA a
        // preferência inteira quando `auto_return` vem com uma back_url que não
        // é pública. Em desenvolvimento a URL cai em http://localhost, então
        // fixar isso incondicionalmente quebraria a criação de preferência na
        // máquina de quem estiver desenvolvendo.
        ...(input.successUrl.startsWith("https://") ? { auto_return: "approved" } : {}),
    }

    const data = (await mercadoPagoFetch("/checkout/preferences", {
        method: "POST",
        body: JSON.stringify(body),
    })) as { id?: string; init_point?: string }

    if (!data.id || !data.init_point) {
        throw new Error("Mercado Pago devolveu preferência sem id ou init_point")
    }

    return { id: data.id, initPoint: data.init_point }
}

/**
 * Busca um pagamento. É obrigatório: o webhook entrega SÓ o ID, e status,
 * valor e vínculo com o pedido só existem aqui.
 */
export async function getPayment(paymentId: string): Promise<MercadoPagoPayment> {
    const data = (await mercadoPagoFetch(`/v1/payments/${paymentId}`)) as {
        id?: number | string
        status?: string
        transaction_amount?: number
        currency_id?: string
        external_reference?: string
        payer?: { email?: string; first_name?: string; last_name?: string }
    }

    const nome = [data.payer?.first_name, data.payer?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim()

    return {
        id: String(data.id ?? paymentId),
        status: data.status ?? "unknown",
        transactionAmount: data.transaction_amount ?? null,
        currencyId: data.currency_id ?? null,
        externalReference: data.external_reference ?? null,
        payerEmail: data.payer?.email ?? null,
        payerName: nome || null,
    }
}
