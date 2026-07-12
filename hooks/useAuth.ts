// hooks/useAuth.ts
"use client"

import { createBrowserClient } from "@supabase/ssr"
import { useEffect, useState } from "react"

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [role, setRole] = useState<string | null>(null)

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        let active = true

        const loadRole = async () => {
            try {
                const res = await fetch("/api/user/role")
                if (!res.ok) {
                    if (active) setRole(null)
                    return
                }
                const data = await res.json()
                if (active) setRole(data.role ?? null)
            } catch {
                if (active) setRole(null)
            }
        }

        // Verificar sessão inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!active) return
            setIsAuthenticated(!!session)
            setIsLoading(false)
            if (session) {
                loadRole()
            } else {
                setRole(null)
            }
        })

        // Ouvir mudanças de autenticação
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!active) return
            setIsAuthenticated(!!session)
            if (session) {
                loadRole()
            } else {
                setRole(null)
            }
        })

        return () => {
            active = false
            subscription.unsubscribe()
        }
    }, [])

    return { isAuthenticated, isLoading, role, isAdmin: role === "ADMIN" }
}
