// lib/supabase/client.ts

import { createBrowserClient } from "@supabase/ssr"
import { getPublicSupabaseConfig } from "@/lib/env"

export function createClient() {
    const { url, anonKey } = getPublicSupabaseConfig()

    return createBrowserClient(url, anonKey)
}
