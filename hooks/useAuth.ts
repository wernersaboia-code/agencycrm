// hooks/useAuth.ts
"use client"

import { createBrowserClient } from "@supabase/ssr"
import { useEffect, useState } from "react"

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Verificar sessão inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session)
            setIsLoading(false)
        })

        // Ouvir mudanças de autenticação
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session)
        })

        return () => subscription.unsubscribe()
    }, [])

    return { isAuthenticated, isLoading }
}