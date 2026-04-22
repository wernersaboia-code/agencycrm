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
    // ROTAS PÚBLICAS - Easy Prospect (Marketplace)
    // ============================================
    const marketplaceRoutes = [
        "/",
        "/catalog",
        "/list",
        "/my-purchases",
        "/checkout",
        "/cart",
    ]

    const isMarketplaceRoute = marketplaceRoutes.some((route) => {
        if (route === "/") return pathname === "/"
        return pathname === route || pathname.startsWith(`${route}/`)
    })

    // ============================================
    // ROTAS PÚBLICAS DO CRM
    // ============================================
    const crmPublicRoutes = [
        "/crm",
        "/crm/sign-in",
        "/crm/sign-up",
        "/crm/pricing",
        "/crm/features",
    ]

    const isCRMPublicRoute = crmPublicRoutes.some((route) =>
        pathname === route || pathname.startsWith(`${route}/`)
    )

    // ============================================
    // ROTAS DE AUTH (públicas - legado)
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
    // CRM PÚBLICO - não verifica auth
    // ============================================
    if (isCRMPublicRoute) {
        return supabaseResponse
    }

    // ============================================
    // VERIFICAR AUTENTICAÇÃO
    // ============================================
    try {
        const { data: { user } } = await supabase.auth.getUser()

        // Se não está logado e tenta acessar rota protegida
        if (!user && !isAuthRoute) {
            const url = request.nextUrl.clone()

            // Se está tentando acessar o CRM, redireciona para /crm/sign-in
            if (pathname.startsWith('/crm')) {
                url.pathname = "/crm/sign-in"
            }
            // Se está tentando acessar dashboard legado, redireciona para /crm/sign-in
            else if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
                url.pathname = "/crm/sign-in"
            }
            // Outras rotas protegidas
            else {
                url.pathname = "/sign-in"
            }

            url.searchParams.set("redirect", pathname)
            return NextResponse.redirect(url)
        }

        // Se está logado e tenta acessar página de auth
        if (user && isAuthRoute) {
            const url = request.nextUrl.clone()
            const redirectParam = request.nextUrl.searchParams.get("redirect")

            // Se veio do marketplace, vai para my-purchases
            if (redirectParam?.startsWith("/my-purchases") || redirectParam?.startsWith("/checkout")) {
                url.pathname = redirectParam
            }
            // Se veio do CRM, vai para dashboard do CRM
            else if (redirectParam?.startsWith("/crm")) {
                url.pathname = redirectParam
            }
            // Se está acessando /sign-in diretamente
            else {
                // Verificar se é uma rota do CRM ou Marketplace pelo referer
                const referer = request.headers.get("referer") || ""

                if (referer.includes("/crm")) {
                    url.pathname = "/crm/dashboard"
                } else if (referer.includes("/catalog") || referer.includes("/cart") || referer.includes("/checkout")) {
                    url.pathname = "/my-purchases"
                } else {
                    // Default: CRM dashboard
                    url.pathname = "/crm/dashboard"
                }
            }

            return NextResponse.redirect(url)
        }

        // ============================================
        // REDIRECIONAR ROTAS LEGADAS PARA NOVAS ROTAS
        // ============================================
        if (user) {
            const url = request.nextUrl.clone()
            let shouldRedirect = false

            // Redirecionar /dashboard para /crm/dashboard
            if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
                url.pathname = pathname.replace('/dashboard', '/crm/dashboard')
                shouldRedirect = true
            }
            // Redirecionar /leads para /crm/leads
            else if (pathname === '/leads' || pathname.startsWith('/leads/')) {
                url.pathname = pathname.replace('/leads', '/crm/leads')
                shouldRedirect = true
            }
            // Redirecionar /campaigns para /crm/campaigns
            else if (pathname === '/campaigns' || pathname.startsWith('/campaigns/')) {
                url.pathname = pathname.replace('/campaigns', '/crm/campaigns')
                shouldRedirect = true
            }
            // Redirecionar /templates para /crm/templates
            else if (pathname === '/templates' || pathname.startsWith('/templates/')) {
                url.pathname = pathname.replace('/templates', '/crm/templates')
                shouldRedirect = true
            }
            // Redirecionar /calls para /crm/calls
            else if (pathname === '/calls' || pathname.startsWith('/calls/')) {
                url.pathname = pathname.replace('/calls', '/crm/calls')
                shouldRedirect = true
            }
            // Redirecionar /reports para /crm/reports
            else if (pathname === '/reports' || pathname.startsWith('/reports/')) {
                url.pathname = pathname.replace('/reports', '/crm/reports')
                shouldRedirect = true
            }
            // Redirecionar /settings para /crm/settings
            else if (pathname === '/settings' || pathname.startsWith('/settings/')) {
                url.pathname = pathname.replace('/settings', '/crm/settings')
                shouldRedirect = true
            }
            // Redirecionar /workspaces para /crm/workspaces
            else if (pathname === '/workspaces' || pathname.startsWith('/workspaces/')) {
                url.pathname = pathname.replace('/workspaces', '/crm/workspaces')
                shouldRedirect = true
            }

            if (shouldRedirect) {
                // Preservar query params
                url.search = request.nextUrl.search
                return NextResponse.redirect(url)
            }
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