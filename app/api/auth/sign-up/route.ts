// app/api/auth/sign-up/route.ts
//
// Cadastro.
//
// Ate aqui o navegador chamava supabase.auth.signUp() direto, e o e-mail saia
// do template do painel — um so, em ingles. Passando por aqui, o e-mail e
// nosso e sai no idioma da tela.
//
// generateLink cria o usuario SEM enviar nada e devolve o token; o envio e a
// linha seguinte, nossa. A regra em si mora em lib/auth/sign-up.ts, que e onde
// os testes estao.
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email"
import { getSystemSmtpConfig } from "@/lib/email/system-smtp"
import { checkPersistentRateLimit, getClientIp } from "@/lib/rate-limit"
import { getPublicAppUrl } from "@/lib/env"
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locales"
import { registrarUsuario, type CriarUsuarioResult } from "@/lib/auth/sign-up"

const corpoSchema = z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    // A senha NAO e validada aqui: quem valida e validarSenha, para a tela
    // receber o codigo do problema e traduzir. Aqui so limitamos o tamanho,
    // porque hash de senha gigante e trabalho de CPU de graca para quem ataca.
    password: z.string().min(1).max(200),
    locale: z.string().optional(),
})

function localeDoCorpo(valor: string | undefined): Locale {
    return valor && isLocale(valor) ? valor : DEFAULT_LOCALE
}

export async function POST(request: NextRequest) {
    try {
        // O cadastro nao tem sessao, entao o balde e por IP. O teto e baixo de
        // proposito: era a protecao que vinha de graca com o signUp do
        // Supabase e agora e nossa.
        const permitido = await checkPersistentRateLimit(
            "auth:sign-up",
            getClientIp(request),
            5,
            60_000
        )
        if (!permitido) {
            return NextResponse.json({ error: "too_many_requests" }, { status: 429 })
        }

        const corpo = corpoSchema.safeParse(await request.json())

        if (!corpo.success) {
            return NextResponse.json({ error: "dados_invalidos" }, { status: 400 })
        }

        const smtp = getSystemSmtpConfig()

        if (!smtp) {
            console.error("[SignUp] Nenhuma configuracao SMTP disponivel")
            return NextResponse.json({ error: "servico_indisponivel" }, { status: 503 })
        }

        const admin = createAdminClient()

        const resultado = await registrarUsuario(
            {
                appUrl: getPublicAppUrl(),
                criarUsuario: async ({ email, password, metadata }): Promise<CriarUsuarioResult> => {
                    const { data, error } = await admin.auth.admin.generateLink({
                        type: "signup",
                        email,
                        password,
                        options: { data: metadata },
                    })

                    if (error) {
                        // E-mail ja cadastrado nao e falha: e o outro caminho
                        // previsto, e quem decide o que fazer com ele e
                        // registrarUsuario. O Supabase sinaliza por codigo ou
                        // por 422, dependendo da versao.
                        const jaExiste =
                            error.code === "email_exists" ||
                            error.status === 422 ||
                            /already registered|already exists/i.test(error.message)

                        if (jaExiste) {
                            return { situacao: "ja_existe" }
                        }

                        throw error
                    }

                    const tokenHash = data?.properties?.hashed_token

                    if (!tokenHash) {
                        throw new Error("generateLink devolveu link sem hashed_token")
                    }

                    return { situacao: "criado", tokenHash }
                },
                enviarEmail: async ({ to, subject, html }) => {
                    const envio = await sendEmail({ to, subject, html }, smtp)
                    return { success: envio.success }
                },
            },
            {
                name: corpo.data.name,
                email: corpo.data.email,
                password: corpo.data.password,
                locale: localeDoCorpo(corpo.data.locale),
            }
        )

        if (resultado.status === "senha_fraca") {
            return NextResponse.json(
                { error: "senha_fraca", problema: resultado.problema },
                { status: 400 }
            )
        }

        if (resultado.status === "erro") {
            return NextResponse.json({ error: "falha_no_cadastro" }, { status: 500 })
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error("[SignUp] Erro inesperado:", error)
        return NextResponse.json({ error: "falha_no_cadastro" }, { status: 500 })
    }
}
