import { getPublicPaypalClientId } from "@/lib/env"

function getRequiredServerEnv(name: string): string {
    const value = process.env[name]

    if (!value) {
        throw new Error(`${name} nao configurada`)
    }

    return value
}

export function getPaypalServerConfig() {
    return {
        clientId: getPublicPaypalClientId(),
        clientSecret: getRequiredServerEnv("PAYPAL_CLIENT_SECRET"),
        mode: process.env.PAYPAL_MODE === "live" ? "live" : "sandbox",
    }
}

export function getStripeServerConfig() {
    return {
        secretKey: getRequiredServerEnv("STRIPE_SECRET_KEY"),
    }
}

/**
 * O secret do webhook fica em getter próprio: a rota de criação de sessão não
 * pode falhar por causa de uma variável que só o webhook usa.
 */
export function getStripeWebhookSecret(): string {
    return getRequiredServerEnv("STRIPE_WEBHOOK_SECRET")
}

export function getMercadoPagoServerConfig() {
    return {
        accessToken: getRequiredServerEnv("MERCADOPAGO_ACCESS_TOKEN"),
    }
}

/**
 * Getter próprio, mesmo motivo do Stripe: a rota de criação de preferência não
 * pode falhar por causa de uma variável que só o webhook usa.
 */
export function getMercadoPagoWebhookSecret(): string {
    return getRequiredServerEnv("MERCADOPAGO_WEBHOOK_SECRET")
}

export function getPaddleServerConfig() {
    return {
        apiKey: getRequiredServerEnv("PADDLE_API_KEY"),
    }
}

/**
 * Getter próprio, mesmo motivo do Stripe e do Mercado Pago: a rota de criação
 * de transação não pode falhar por causa de uma variável que só o webhook usa.
 */
export function getPaddleWebhookSecret(): string {
    return getRequiredServerEnv("PADDLE_WEBHOOK_SECRET")
}
