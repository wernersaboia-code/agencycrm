// lib/auth/sign-up.ts
//
// A regra do cadastro, separada da rota.
//
// Fica aqui, e nao no route.ts, porque e a parte que precisa de teste: a
// promessa de que e-mail ja cadastrado responde igual a e-mail novo nao pode
// depender de alguem lembrar dela na proxima edicao. A rota vira fiacao.
//
// As dependencias entram por parametro pelo mesmo motivo de
// lib/checkout/fulfillment.ts: nenhum teste toca rede.

import type { Locale } from "@/lib/i18n/locales"
import { validarSenha, type PasswordProblem } from "./password-policy"
import { generateSignupConfirmationEmail } from "@/lib/email/templates/signup-confirmation"
import { generateAccountExistsEmail } from "@/lib/email/templates/account-exists"

/** Para onde a pessoa vai depois de confirmar. O CRM nao e destino de cadastro externo. */
const DESTINO_APOS_CONFIRMAR = "/my-purchases"

export type SignUpInput = {
    name: string
    email: string
    password: string
    locale: Locale
}

export type CriarUsuarioResult =
    | { situacao: "criado"; tokenHash: string }
    | { situacao: "ja_existe" }

export type SignUpDeps = {
    criarUsuario: (input: {
        email: string
        password: string
        metadata: Record<string, string>
    }) => Promise<CriarUsuarioResult>
    enviarEmail: (params: { to: string; subject: string; html: string }) => Promise<{ success: boolean }>
    appUrl: string
}

export type SignUpOutcome =
    | { status: "ok" }
    | { status: "senha_fraca"; problema: PasswordProblem }
    | { status: "erro" }

function urlDeConfirmacao(appUrl: string, tokenHash: string, locale: Locale): string {
    const params = new URLSearchParams({
        token_hash: tokenHash,
        next: DESTINO_APOS_CONFIRMAR,
        lang: locale,
    })

    return `${appUrl}/auth/confirm?${params.toString()}`
}

function urlDeEntrada(appUrl: string, locale: Locale): string {
    return `${appUrl}/sign-in?lang=${locale}`
}

export async function registrarUsuario(
    deps: SignUpDeps,
    input: SignUpInput
): Promise<SignUpOutcome> {
    const problema = validarSenha(input.password)
    if (problema) {
        return { status: "senha_fraca", problema }
    }

    // O endereco vira a identidade da conta; espaco invisivel e caixa alta
    // criariam duas contas para a mesma pessoa.
    const email = input.email.trim().toLowerCase()

    let resultado: CriarUsuarioResult
    try {
        resultado = await deps.criarUsuario({
            email,
            password: input.password,
            metadata: {
                name: input.name.trim(),
                locale: input.locale,
                // A variante CRM saiu da tela; todo cadastro externo e do
                // marketplace.
                source: "marketplace",
            },
        })
    } catch (error) {
        console.error("[SignUp] Falha ao criar usuario:", error)
        return { status: "erro" }
    }

    const { subject, html } =
        resultado.situacao === "criado"
            ? await generateSignupConfirmationEmail(
                  {
                      userName: input.name.trim(),
                      confirmUrl: urlDeConfirmacao(deps.appUrl, resultado.tokenHash, input.locale),
                  },
                  input.locale
              )
            : await generateAccountExistsEmail(
                  { signInUrl: urlDeEntrada(deps.appUrl, input.locale) },
                  input.locale
              )

    const envio = await deps.enviarEmail({ to: email, subject, html })

    if (!envio.success) {
        // A tela promete "abra seu e-mail". Prometer isso quando o envio
        // falhou deixa a pessoa esperando uma mensagem que nunca vem.
        return { status: "erro" }
    }

    return { status: "ok" }
}
