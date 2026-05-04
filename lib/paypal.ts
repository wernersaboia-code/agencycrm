// lib/paypal.ts
import { Client, Environment, OrdersController } from "@paypal/paypal-server-sdk"

function getPaypalEnvironment() {
    return process.env.PAYPAL_MODE === "live"
        ? Environment.Production
        : Environment.Sandbox
}

function createPaypalClient() {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET!

    return new Client({
        environment: getPaypalEnvironment(),
        clientCredentialsAuthCredentials: {
            oAuthClientId: clientId,
            oAuthClientSecret: clientSecret,
        },
    })
}

export function paypalOrders() {
    return new OrdersController(createPaypalClient())
}

// Verificar assinatura do webhook (segurança)
export async function verifyWebhookSignature(
    headers: Record<string, string>,
    body: unknown
): Promise<boolean> {
    void headers
    void body

    // TODO: Implementar verificação de webhook
    // https://developer.paypal.com/api/rest/webhooks/
    return false
}
