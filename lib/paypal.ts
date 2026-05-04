// lib/paypal.ts
import { Client, Environment, OrdersController } from "@paypal/paypal-server-sdk"
import { getPaypalServerConfig } from "@/lib/server-env"

function getPaypalEnvironment(mode: string) {
    return mode === "live"
        ? Environment.Production
        : Environment.Sandbox
}

function createPaypalClient() {
    const { clientId, clientSecret, mode } = getPaypalServerConfig()

    return new Client({
        environment: getPaypalEnvironment(mode),
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
