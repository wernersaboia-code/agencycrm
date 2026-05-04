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
