// middleware.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables')
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

    const pathname = request.nextUrl.pathname

    // ============================================
    // ROTAS PÚBLICAS - LeadStore (Marketplace)
    // ============================================
    const marketplaceRoutes = [
        "/",
        "/catalog",
        "/list",
    ]

    const isMarketplaceRoute = marketplaceRoutes.some((route) => {
        if (route === "/") return pathname === "/"
        return pathname === route || pathname.startsWith(`${route}/`)
    })

    // ============================================
    // ROTAS DE AUTH (públicas)
    // ============================================
    const authRoutes = ["/sign-in", "/sign-up", "/forgot-password"]
    const isAuthRoute = authRoutes.some((route) =>
        pathname === route || pathname.startsWith(`${route}/`)
    )

    // ============================================
    // ROTAS DE API e ASSETS - não processar
    // ============================================
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.includes('.')
    ) {
        return supabaseResponse
    }

    // ============================================
    // MARKETPLACE - sempre público, não verifica auth
    // ============================================
    if (isMarketplaceRoute) {
        return supabaseResponse
    }

    // ============================================
    // VERIFICAR AUTENTICAÇÃO PARA ROTAS DO CRM
    // ============================================
    try {
        const { data: { user } } = await supabase.auth.getUser()

        // Se não está logado e tenta acessar rota protegida (CRM)
        if (!user && !isAuthRoute) {
            const url = request.nextUrl.clone()
            url.pathname = "/sign-in"
            return NextResponse.redirect(url)
        }

        // Se está logado e tenta acessar página de login/signup
        if (user && isAuthRoute) {
            const url = request.nextUrl.clone()
            url.pathname = "/dashboard"
            return NextResponse.redirect(url)
        }

    } catch (error) {
        console.error('Middleware auth error:', error)
        return supabaseResponse
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
}