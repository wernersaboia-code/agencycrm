const publicEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
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
