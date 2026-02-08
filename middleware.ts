// middleware.ts

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
    // Verifica se as variáveis de ambiente existem
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables')
        // Em produção, redireciona para uma página de erro ou continua
        return NextResponse.next()
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Rotas públicas (não precisam de autenticação)
    const publicRoutes = ["/sign-in", "/sign-up", "/forgot-password", "/"]
    const isPublicRoute = publicRoutes.some((route) =>
        request.nextUrl.pathname === route ||
        request.nextUrl.pathname.startsWith("/sign-") ||
        request.nextUrl.pathname.startsWith("/forgot-")
    )

    // Rotas de API e assets - não processar
    if (
        request.nextUrl.pathname.startsWith('/api') ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.includes('.')
    ) {
        return supabaseResponse
    }

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser()

        // Se não está logado e tenta acessar rota protegida
        if (!user && !isPublicRoute) {
            const url = request.nextUrl.clone()
            url.pathname = "/sign-in"
            return NextResponse.redirect(url)
        }

        // Se está logado e tenta acessar página de login
        if (user && isPublicRoute && request.nextUrl.pathname !== "/") {
            const url = request.nextUrl.clone()
            url.pathname = "/dashboard"
            return NextResponse.redirect(url)
        }
    } catch (error) {
        console.error('Middleware auth error:', error)
        // Em caso de erro, permite acesso (fail open)
        return supabaseResponse
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes
         */
        "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
}