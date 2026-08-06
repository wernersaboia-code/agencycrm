// app/(app)/auth/confirm/route.ts
//
// Destino do link do NOSSO e-mail de confirmacao.
//
// Existe separada de /auth/callback porque o parametro e outro: o callback
// troca o `code` do fluxo PKCE, que e o que o Supabase manda nos e-mails dele
// (recuperacao de senha, por ora). Aqui chega o `token_hash` do generateLink,
// que se troca por sessao com verifyOtp. Juntar os dois num arquivo so
// significaria um if no meio de dois fluxos de autenticacao sem nada em comum.
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { safeInternalPath } from "@/lib/auth/safe-redirect"

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const tokenHash = searchParams.get("token_hash")
    const next = safeInternalPath(searchParams.get("next"))

    if (!tokenHash) {
        return NextResponse.redirect(`${origin}/sign-in?erro=link_incompleto`)
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({ type: "signup", token_hash: tokenHash })

    if (error) {
        // Caso mais comum: link ja usado ou fora da validade.
        return NextResponse.redirect(`${origin}/sign-in?erro=link_expirado`)
    }

    return NextResponse.redirect(`${origin}${next}`)
}
