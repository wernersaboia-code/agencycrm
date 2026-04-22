// lib/paypal.ts
import paypal from "@paypal/checkout-server-sdk"

// Configurar ambiente
function environment() {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET!

    if (process.env.PAYPAL_MODE === "live") {
        return new paypal.core.LiveEnvironment(clientId, clientSecret)
    }
    return new paypal.core.SandboxEnvironment(clientId, clientSecret)
}

// Cliente PayPal
export function paypalClient() {
    return new paypal.core.PayPalHttpClient(environment())
}

// Verificar assinatura do webhook (segurança)
export async function verifyWebhookSignature(
    headers: Record<string, string>,
    body: any
): Promise<boolean> {
    // TODO: Implementar verificação de webhook
    // https://developer.paypal.com/api/rest/webhooks/
    return true
}