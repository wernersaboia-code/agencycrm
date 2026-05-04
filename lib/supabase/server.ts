// lib/supabase/server.ts

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getPublicSupabaseConfig } from "@/lib/env"

export async function createClient() {
    const cookieStore = await cookies()
    const { url, anonKey } = getPublicSupabaseConfig()

    return createServerClient(
        url,
        anonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // O método `setAll` é chamado de Server Component.
                        // Isso pode ser ignorado se você tiver um middleware
                        // que atualiza as sessões do usuário.
                    }
                },
            },
        }
    )
}
