// hooks/useAuth.ts
"use client"

import { useEffect, useState } from "react"

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [role, setRole] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        let unsubscribe: (() => void) | undefined

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

        // O cliente do Supabase é importado sob demanda, e não no topo do
        // arquivo, porque este hook vive no cabeçalho do marketplace: com o
        // import estático, TODO visitante da landing baixava ~210 KB de
        // JavaScript do Supabase só para o site decidir se mostra "Entrar" ou
        // "Minhas compras". A checagem já era assíncrona (roda no efeito, com
        // `isLoading` até responder), então adiar o download não muda o que a
        // tela faz — só tira o peso do carregamento inicial.
        const start = async () => {
            const { createBrowserClient } = await import("@supabase/ssr")

            if (!active) return

            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { data: { session } } = await supabase.auth.getSession()

            if (!active) return

            setIsAuthenticated(!!session)
            setIsLoading(false)
            if (session) {
                loadRole()
            } else {
                setRole(null)
            }

            const { data } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
                if (!active) return
                setIsAuthenticated(!!novaSessao)
                if (novaSessao) {
                    loadRole()
                } else {
                    setRole(null)
                }
            })

            // O componente pode ter desmontado enquanto o import resolvia; nesse
            // caso o cleanup já rodou e cabe a este bloco desfazer a inscrição.
            if (active) {
                unsubscribe = () => data.subscription.unsubscribe()
            } else {
                data.subscription.unsubscribe()
            }
        }

        start().catch(() => {
            if (active) setIsLoading(false)
        })

        return () => {
            active = false
            unsubscribe?.()
        }
    }, [])

    return { isAuthenticated, isLoading, role, isAdmin: role === "ADMIN" }
}
