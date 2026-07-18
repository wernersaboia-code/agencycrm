import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "@/lib/i18n/routing"
import { stripLocale } from "@/lib/i18n/strip-locale"

const intlMiddleware = createIntlMiddleware(routing)

export async function proxy(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const pathname = request.nextUrl.pathname

    // Rotas públicas e gates de auth são avaliados sobre o caminho sem o
    // prefixo de idioma — senão "/de/catalog" cairia no gate de sessão.
    const { pathname: pathForMatching } = stripLocale(pathname)

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables')
        return new NextResponse('Authentication configuration missing', { status: 503 })
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

    // ============================================
    // ROTAS PÚBLICAS - Easy Prospect (Marketplace)
    // ============================================
    // Vitrine: navegável sem conta. /checkout e /my-purchases exigem sessão —
    // o download já é vinculado à conta, então o gate acontece antes do
    // pagamento em vez de depois do clique no PayPal.
    const marketplaceRoutes = [
        "/",
        "/faq",
        "/opengraph-image",
        "/catalog",
        "/list",
        "/cart",
        "/blog",
    ]

    const isMarketplaceRoute = marketplaceRoutes.some((route) => {
        if (route === "/") return pathForMatching === "/"
        return pathForMatching === route || pathForMatching.startsWith(`${route}/`)
    })

    // Rotas que vivem de fato dentro de app/[locale] — precisam do rewrite do
    // next-intl para casar com o segmento dinâmico. "/opengraph-image" fica de
    // fora por ser um arquivo especial na raiz de app/, sem versão por idioma.
    const localeSegmentRoutes = ["/", "/faq", "/catalog", "/list", "/cart", "/blog", "/checkout", "/my-purchases"]
    const isLocaleSegmentRoute = localeSegmentRoutes.some((route) => {
        if (route === "/") return pathForMatching === "/"
        return pathForMatching === route || pathForMatching.startsWith(`${route}/`)
    })

    // O middleware de locale só se aplica às rotas do segmento [locale]: ele
    // reescreve a URL (prefixo as-needed) e precisa dos cookies de sessão já
    // aplicados. Rotas fora do segmento (CRM, super-admin, auth legado) não
    // têm página correspondente com prefixo de idioma e virariam 404 se
    // passassem por aqui.
    const respond = () => {
        if (!isLocaleSegmentRoute) return supabaseResponse

        const intlResponse = intlMiddleware(request)
        for (const cookie of supabaseResponse.cookies.getAll()) {
            intlResponse.cookies.set(cookie)
        }
        return intlResponse
    }

    // ============================================
    // ROTAS PÚBLICAS DO CRM
    // ============================================
    const crmPublicRoutes = [
        "/crm",
        "/crm/sign-in",
        "/crm/sign-up",
    ]

    const isCRMPublicRoute = crmPublicRoutes.some((route) =>
        pathForMatching === route || pathForMatching.startsWith(`${route}/`)
    )

    // ============================================
    // ROTAS DE AUTH (públicas - legado)
    // ============================================
    const authRoutes = ["/sign-in", "/sign-up", "/forgot-password"]
    const isAuthRoute = authRoutes.some((route) =>
        pathForMatching === route || pathForMatching.startsWith(`${route}/`)
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
        return respond()
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
            if (pathForMatching.startsWith('/crm')) {
                url.pathname = "/crm/sign-in"
            }
            // Se está tentando acessar dashboard legado, redireciona para /crm/sign-in
            else if (pathForMatching === '/dashboard' || pathForMatching.startsWith('/dashboard/')) {
                url.pathname = "/crm/sign-in"
            }
            // Outras rotas protegidas
            else {
                url.pathname = "/sign-in"
            }

            // A query da rota original não pertence a /sign-in — ela vai
            // inteira dentro de `redirect`, senão /checkout/success?purchaseId=…
            // perde o pedido para sempre.
            const originalTarget = `${pathname}${request.nextUrl.search}`
            url.search = ""
            url.searchParams.set("redirect", originalTarget)
            return NextResponse.redirect(url)
        }

        // Se está logado e tenta acessar página de auth
        if (user && isAuthRoute) {
            const url = request.nextUrl.clone()
            const redirectParam = request.nextUrl.searchParams.get("redirect")

            if (redirectParam?.startsWith("/") && !redirectParam.startsWith("//")) {
                const redirectUrl = new URL(redirectParam, request.url)
                // O parâmetro redirect pode carregar prefixo de idioma (ex.:
                // "/de/checkout") — o casamento contra a whitelist precisa
                // ignorá-lo, mas o destino do redirect (abaixo) preserva a
                // URL real, prefixo incluso.
                const { pathname: redirectPathForMatching } = stripLocale(redirectUrl.pathname)
                const allowedRedirects = [
                    "/dashboard",
                    "/crm",
                    "/my-purchases",
                    "/checkout",
                    "/cart",
                    "/super-admin",
                ]
                const isAllowedRedirect = allowedRedirects.some((path) =>
                    redirectPathForMatching === path || redirectPathForMatching.startsWith(`${path}/`)
                )

                if (isAllowedRedirect) {
                    url.pathname = redirectUrl.pathname
                    url.search = redirectUrl.search
                    return NextResponse.redirect(url)
                }
            }

            // Se está acessando /sign-in diretamente, ou se o redirect não é
            // permitido, leva para a área de compras (destino seguro para
            // qualquer usuário). O super-admin é acessível pelo menu para quem
            // tem a role — não é um bom padrão para o usuário comum.
            url.pathname = "/my-purchases"

            return NextResponse.redirect(url)
        }

    } catch (error) {
        console.error('Middleware auth error:', error)

        // Fail-closed: se a verificação de auth falhar, não liberamos rota
        // protegida. Rotas de auth seguem acessíveis para o usuário se logar.
        if (!isAuthRoute) {
            const url = request.nextUrl.clone()
            url.pathname = pathForMatching.startsWith('/crm') ? '/crm/sign-in' : '/sign-in'
            url.searchParams.set('redirect', pathname)
            return NextResponse.redirect(url)
        }

        return supabaseResponse
    }

    return respond()
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
}

export default proxy
