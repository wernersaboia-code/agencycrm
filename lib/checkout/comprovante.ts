// lib/checkout/comprovante.ts
//
// Dados do comprovante de compra, separados de como ele é desenhado.
//
// A montagem fica aqui, pura e testável, e o PDF em
// `lib/pdf/templates/purchase-receipt.tsx`. Sem essa separação, testar a regra
// de "de onde vem o nome do comprador" exigiria renderizar um PDF inteiro.
//
// O documento é COMPROVANTE DE COMPRA, não nota fiscal: registra o que foi
// pago, por quem e a quem. Nenhum imposto é calculado ou declarado aqui, e o
// próprio PDF diz isso em letra visível — comprovante apresentado como nota
// fiscal é problema para o comprador, não conveniência.

import { dadosDoVendedor, type Vendedor } from "./vendedor"

/** O que o comprovante precisa saber da compra, sem depender do tipo do Prisma. */
export interface CompraParaComprovante {
    id: string
    provider: string
    status: string
    total: number | { toString(): string }
    currency: string
    buyerEmail: string | null
    buyerName: string | null
    buyerTaxId: string | null
    paidAt: Date | null
    createdAt: Date
    user: { name: string | null; email: string }
    items: Array<{
        price: number | { toString(): string }
        list: { name: string }
    }>
}

export interface DadosComprovante {
    numero: string
    pagoEm: Date
    provedor: string
    comprador: { nome: string; email: string; documento?: string }
    itens: Array<{ nome: string; preco: number }>
    total: number
    moeda: string
    vendedor: Vendedor
}

/**
 * `Decimal` do Prisma não é `number`: sem o `toString`, `Number(decimal)` já
 * devolveu `NaN` neste projeto e o total saiu vazio no e-mail.
 */
function paraNumero(valor: number | { toString(): string }): number {
    return typeof valor === "number" ? valor : Number(valor.toString())
}

/** Mesmo prefixo curto que o e-mail de confirmação mostra como número do pedido. */
export function numeroDoComprovante(purchaseId: string): string {
    return purchaseId.slice(0, 8).toUpperCase()
}

export function montarComprovante(
    compra: CompraParaComprovante,
    env: Record<string, string | undefined> = process.env
): DadosComprovante {
    if (compra.status !== "paid") {
        throw new Error(`Compra ${compra.id} não está paga: comprovante só existe para compra paga`)
    }

    return {
        numero: numeroDoComprovante(compra.id),
        // Compra antiga pode não ter paidAt; sem data o documento não serve.
        pagoEm: compra.paidAt ?? compra.createdAt,
        provedor: compra.provider,
        comprador: {
            // O snapshot vem primeiro: é o nome de quem pagou, na hora em que
            // pagou. O da conta pode ter mudado depois, e o comprovante
            // descreve o passado.
            nome: compra.buyerName ?? compra.user.name ?? compra.user.email,
            email: compra.buyerEmail ?? compra.user.email,
            documento: compra.buyerTaxId ?? undefined,
        },
        itens: compra.items.map((item) => ({
            nome: item.list.name,
            preco: paraNumero(item.price),
        })),
        total: paraNumero(compra.total),
        moeda: compra.currency,
        vendedor: dadosDoVendedor(env),
    }
}
