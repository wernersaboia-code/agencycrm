// lib/stripe.ts
//
// Cliente Stripe e conversões de valor. O Stripe trabalha com a menor unidade
// da moeda (centavos, inteiros); o nosso domínio trabalha com decimais de
// ponto flutuante. As duas funções de conversão são a ÚNICA fronteira entre
// os dois mundos — e são puras para serem testadas sem rede.

import Stripe from "stripe"
import { getStripeServerConfig } from "@/lib/server-env"

/**
 * A presença da secret é o que habilita o provedor no servidor. A UI usa a
 * publishable key pública como sinal (espelhando o padrão do PayPal).
 */
export function isStripeConfigured(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY)
}

/** Instância por chamada (mesmo padrão de `paypalOrders`). */
export function getStripe(): Stripe {
    const { secretKey } = getStripeServerConfig()
    return new Stripe(secretKey)
}

/** Decimal do domínio (49.9) → centavos inteiros do Stripe (4990). */
export function toStripeAmount(value: number): number {
    return Math.round(value * 100)
}

/** Centavos do Stripe (4990) → string com 2 casas ("49.90"), formato que `amountMatches` exige. */
export function fromStripeAmount(cents: number): string {
    return (cents / 100).toFixed(2)
}
