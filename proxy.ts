import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "@/lib/i18n/routing"
import { stripLocale } from "@/lib/i18n/strip-locale"

const intlMiddleware = createIntlMiddleware(routing)

// Casamento compartilhado de rota: usado por toda whitelist/blacklist deste
// arquivo para não repetir a mesma expressão de "===" ou startsWith(`${r}/`)
// em cada lista. "/" é tratado à parte porque startsWith("//") casaria com
// qualquer caminho.
function matchesRoute(pathname: string, routes: string[]): boolean {
    return routes.some((route) => {
        if (route === "/") return pathname === "/"
        return pathname === route || pathname.startsWith(`${route}/`)
    })
}

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

    // Layouts do App Router não recebem o caminho da requisição, e o layout do
    // CRM precisa dele para não aplicar a guarda de workspace justamente nas
    // telas que servem para sair daquele estado. Precisa ir no header do
    // REQUEST encaminhado: header de resposta não é visível para `headers()`
    // dentro de um Server Component.
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-pathname", pathname)

    let supabaseResponse = NextResponse.next({
        request: { headers: requestHeaders },
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
    // RESGATE DO CÓDIGO DE CONFIRMAÇÃO NA RAIZ
    // ============================================
    // O Supabase só honra o `emailRedirectTo` se a URL estiver na lista de
    // Redirect URLs do projeto; fora dela, ele descarta o destino e usa o
    // Site URL — e o código de sessão cai na home, onde ninguém o troca. O
    // resultado é a conta ficar confirmada mas a pessoa não logada.
    //
    // Corrigir a configuração resolve os e-mails futuros, mas não os já
    // enviados: aqueles carregam a URL errada gravada no corpo. Este desvio
    // recupera esses casos e cobre a mesma falha em recuperação de senha.
    if (pathForMatching === "/" && request.nextUrl.searchParams.has("code")) {
        const url = request.nextUrl.clone()
        const code = request.nextUrl.searchParams.get("code") ?? ""
        url.pathname = "/auth/callback"
        url.search = ""
        url.searchParams.set("code", code)
        return NextResponse.redirect(url)
    }

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
        "/privacy",
        "/terms",
    ]

    const isMarketplaceRoute = matchesRoute(pathForMatching, marketplaceRoutes)

    // Lista de EXCLUSÃO: prefixos que estruturalmente ficam fora de
    // app/[locale] (grupos de rota app/(crm), app/(auth), e as pastas de raiz
    // app/crm, app/super-admin, app/privacy, app/terms, além do arquivo
    // especial app/opengraph-image.tsx). Tudo que não estiver aqui é
    // considerado parte do segmento de locale por padrão — assim uma rota
    // nova do funil (ex.: app/[locale]/nova-rota) passa a funcionar sem
    // ninguém lembrar de listá-la. Antes desta inversão, o esquecimento
    // silencioso ia na direção oposta: "/de/nova-rota" funcionava e
    // "/nova-rota" (locale padrão) dava 404.
    // Nota: /api já é interceptado no bloco anterior (linhas 148-154), não
    // precisa estar listado aqui.
    const nonLocaleSegmentPrefixes = [
        "/crm",
        "/super-admin",
        "/sign-in",
        "/sign-up",
        "/forgot-password",
        // Callback de confirmação de e-mail: não tem versão por idioma e o
        // prefixo de locale quebraria o link que o Supabase já enviou.
        "/auth",
        "/privacy",
        "/terms",
        "/opengraph-image",
        // app/(crm) — grupo de rota, sem prefixo na URL, mas fora de [locale]
        "/dashboard",
        "/calls",
        "/campaigns",
        "/leads",
        "/pricing",
        "/purchases",
        "/reports",
        "/settings",
        "/templates",
        "/trial-expired",
        "/workspaces",
    ]
    const isLocaleSegmentRoute = !matchesRoute(pathForMatching, nonLocaleSegmentPrefixes)

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

    const isCRMPublicRoute = matchesRoute(pathForMatching, crmPublicRoutes)

    // ============================================
    // ROTAS DE AUTH (públicas - legado)
    // ============================================
    const authRoutes = ["/sign-in", "/sign-up", "/forgot-password"]
    const isAuthRoute = matchesRoute(pathForMatching, authRoutes)

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
    // CALLBACK DE CONFIRMAÇÃO DE E-MAIL
    // ============================================
    // Precisa passar direto, sem nenhuma das duas regras de auth:
    // - quem chega SEM sessão não pode ser mandado ao login, porque é esta
    //   rota que cria a sessão a partir do código do e-mail;
    // - quem chega COM sessão não pode ser mandado para /my-purchases, senão
    //   a troca do código nunca roda e a conta fica sem confirmar.
    if (pathForMatching === "/auth/callback") {
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
                const isAllowedRedirect = matchesRoute(redirectPathForMatching, allowedRedirects)

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
