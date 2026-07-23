// lib/supabase/admin.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getServiceSupabaseConfig } from "@/lib/env"

/**
 * Client com service role para operações server-side de storage (bucket privado).
 * NUNCA importar em código client — usa a chave secreta.
 */
export function createAdminClient(): SupabaseClient {
    const { url, serviceRoleKey } = getServiceSupabaseConfig()
    return createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
}
