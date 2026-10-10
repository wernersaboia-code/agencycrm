// app/api/free-sample/account/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import { createFreeSampleSignedUrl } from "@/lib/supabase/free-sample"
import { gerarToken, calcularExpiracao } from "@/lib/free-sample/token"
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales"

/**
 * O estudo gratuito de quem tem conta: o botão em Minhas compras aponta aqui.
 *
 * É a mesma amostra ativa do formulário da home, entregue sem pedir e-mail —
 * a conta já é o contato. Como o estudo é um só e igual para todos, não há
 * nada a liberar por pessoa: estar logado basta.
 */
export async function GET(request: Request) {
    const url = new URL(request.url)
    const lang = url.searchParams.get("lang")
    const locale = lang && isLocale(lang) ? lang : DEFAULT_LOCALE

    const user = await getAuthenticatedUser()
    if (!user) {
        const login = new URL("/sign-in", url.origin)
        login.searchParams.set("redirect", "/my-purchases")
        login.searchParams.set("lang", locale)
        return NextResponse.redirect(login)
    }

    try {
        const amostra = await prisma.freeSample.findFirst({
            where: { isActive: true },
            select: { filePath: true },
        })
        if (!amostra) {
            return NextResponse.json({ error: "Estudo gratuito indisponível" }, { status: 404 })
        }

        // Registrar serve só para o admin contar quantos baixaram; se falhar,
        // a pessoa recebe o arquivo do mesmo jeito.
        try {
            await prisma.freeSampleDownload.create({
                data: {
                    email: user.email,
                    // Não houve caixa de consentimento: o download veio da conta,
                    // não do formulário que promete mandar o arquivo por e-mail.
                    consent: false,
                    locale,
                    // O token não vai para lugar nenhum; existe porque a coluna é
                    // única e obrigatória.
                    token: gerarToken(),
                    tokenExpiresAt: calcularExpiracao(new Date()),
                    sampleFilePath: amostra.filePath,
                    userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
                },
            })
        } catch (error) {
            console.error("Erro ao registrar download do estudo gratuito pela conta:", error)
        }

        return NextResponse.redirect(await createFreeSampleSignedUrl(amostra.filePath))
    } catch (error) {
        console.error("Erro ao servir o estudo gratuito pela conta:", error)
        return NextResponse.json({ error: "Falha no download" }, { status: 500 })
    }
}
