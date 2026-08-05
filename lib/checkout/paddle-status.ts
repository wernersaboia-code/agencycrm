// lib/checkout/paddle-status.ts
//
// Tradução do evento de webhook do Paddle para a ação do nosso domínio.
//
// Deliberadamente mais estreito que o do Mercado Pago: aqui UM evento age, e
// todo o resto é registrado sem alterar a compra.

export type PaddleAction = "fulfill" | "ignore"

const ACOES: Record<string, PaddleAction> = {
    "transaction.completed": "fulfill",
}

/**
 * Evento não mapeado nunca altera a compra.
 *
 * Em particular `transaction.payment_failed`: no overlay o comprador retenta
 * com outro cartão dentro da MESMA transação, então tratar uma tentativa
 * recusada como pedido morto cobraria o dinheiro sem entregar a lista — foi
 * exatamente o bug corrigido no Mercado Pago em 64c82d7.
 */
export function mapPaddleEvent(eventType: string): PaddleAction {
    return ACOES[eventType] ?? "ignore"
}
