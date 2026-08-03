// lib/checkout/mercadopago-status.ts
//
// Tradução do status de pagamento do Mercado Pago para a ação do nosso
// domínio. Separada da rota porque é a regra que o Pix tornou não-trivial e
// que precisa de teste sem rede.

export type PaymentAction = "fulfill" | "ignore" | "fail"

const ACOES: Record<string, PaymentAction> = {
    approved: "fulfill",

    // O comprador ainda está no app do banco (Pix) ou o cartão está em
    // análise. O Mercado Pago reenvia o evento quando resolver.
    pending: "ignore",
    in_process: "ignore",
    authorized: "ignore",
    in_mediation: "ignore",

    rejected: "fail",
    cancelled: "fail",

    // Estorno e chargeback são posteriores a um pagamento real. Tratá-los aqui
    // como falha apagaria o registro de uma compra que aconteceu.
    refunded: "ignore",
    charged_back: "ignore",
}

/** Status desconhecido nunca altera a compra — o padrão seguro é não agir. */
export function mapPaymentStatus(status: string): PaymentAction {
    return ACOES[status] ?? "ignore"
}
