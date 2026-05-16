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

/**
 * Verifica a assinatura de um webhook do PayPal.
 * Requer PAYPAL_WEBHOOK_ID nas variáveis de ambiente.
 * @see https://developer.paypal.com/api/rest/webhooks/
 */
export async function verifyWebhookSignature(
    headers: Record<string, string>,
    body: unknown
): Promise<boolean> {
    try {
        const webhookId = process.env.PAYPAL_WEBHOOK_ID
        if (!webhookId) {
            console.warn("[PayPal] PAYPAL_WEBHOOK_ID não configurado — webhook verification skipped")
            return false
        }

        const transmissionId = headers["paypal-transmission-id"]
        const certUrl = headers["paypal-cert-url"]
        const authAlgo = headers["paypal-auth-algo"]
        const transmissionSig = headers["paypal-transmission-sig"]

        if (!transmissionId || !certUrl || !authAlgo || !transmissionSig) {
            return false
        }

        const { clientId, clientSecret, mode } = getPaypalServerConfig()
        const environment = getPaypalEnvironment(mode)

        const response = await fetch(`${environment === Environment.Production ? "https://api.paypal.com" : "https://api.sandbox.paypal.com"}/v1/notifications/verify-webhook-signature`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            },
            body: JSON.stringify({
                transmission_id: transmissionId,
                cert_url: certUrl,
                auth_algo: authAlgo,
                transmission_sig: transmissionSig,
                webhook_id: webhookId,
                webhook_event: body,
            }),
        })

        if (!response.ok) {
            console.error("[PayPal] Webhook verification failed:", await response.text())
            return false
        }

        const result = await response.json()
        return result.verification_status === "SUCCESS"
    } catch (error) {
        console.error("[PayPal] Webhook verification error:", error)
        return false
    }
}
