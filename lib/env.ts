const publicEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
} as const

type PublicEnvName = keyof typeof publicEnv

function getRequiredPublicEnv(name: PublicEnvName): string {
    const value = publicEnv[name]

    if (!value) {
        throw new Error(`${name} nao configurada`)
    }

    return value
}

export function getPublicSupabaseConfig() {
    return {
        url: getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
        anonKey: getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    }
}

export function getPublicAppUrl() {
    const appUrl = publicEnv.NEXT_PUBLIC_APP_URL

    if (appUrl) {
        return appUrl.replace(/\/$/, "")
    }

    if (process.env.NODE_ENV !== "production") {
        return "http://localhost:3000"
    }

    throw new Error("NEXT_PUBLIC_APP_URL nao configurada")
}

export function getPublicPaypalClientId() {
    return getRequiredPublicEnv("NEXT_PUBLIC_PAYPAL_CLIENT_ID")
}

export function getOptionalPublicPaypalClientId() {
    return publicEnv.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""
}

/**
 * Presença da publishable key é o sinal público de "Stripe habilitado" para a
 * UI (o checkout hospedado não usa a pk no client, mas manter o par de chaves
 * documentado evita configuração pela metade).
 */
export function getOptionalPublicStripePublishableKey() {
    return publicEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
}

/**
 * Sinal público de "Mercado Pago habilitado" para a UI, espelhando o padrão de
 * PayPal e Stripe. O Checkout Pro é hospedado e não usa a public key no
 * client, mas manter o par documentado evita configuração pela metade.
 */
export function getOptionalPublicMercadoPagoPublicKey() {
    return publicEnv.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || ""
}

export function getServiceSupabaseConfig() {
    const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL nao configurada")
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada")

    return { url, serviceRoleKey }
}
