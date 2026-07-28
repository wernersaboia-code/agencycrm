import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { safeInternalPath } from "@/lib/auth/safe-redirect"

/**
 * Destino do link de confirmação de e-mail.
 *
 * O Supabase manda a pessoa para cá com um `code` de uso único; trocá-lo por
 * uma sessão é o que efetivamente confirma a conta. Sem esta rota o link caía
 * direto numa página protegida com o `code` pendurado na URL, ninguém o
 * trocava por sessão, e o middleware devolvia a pessoa para o login — o
 * clássico "o e-mail chegou mas o link não funciona".
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = safeInternalPath(searchParams.get("next"))

    // O Supabase sinaliza link expirado/já usado por aqui, não por exceção.
    const erroSupabase = searchParams.get("error_description") ?? searchParams.get("error")
    if (erroSupabase) {
        return NextResponse.redirect(`${origin}/sign-in?erro=link_invalido`)
    }

    if (!code) {
        return NextResponse.redirect(`${origin}/sign-in?erro=link_incompleto`)
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        // Caso mais comum: link já usado ou fora da validade.
        return NextResponse.redirect(`${origin}/sign-in?erro=link_expirado`)
    }

    return NextResponse.redirect(`${origin}${next}`)
}
