// lib/free-sample/request-download.ts
"use server"

import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { getSystemSmtpConfig } from "@/lib/email/system-smtp"
import { createFreeSampleSignedUrl } from "@/lib/supabase/free-sample"
import { rateLimit } from "@/lib/rate-limit"
import { getClientIpFromHeaders } from "@/lib/http/client-ip"
import { freeSampleRequestSchema } from "@/lib/validations/free-sample"
import { gerarToken, calcularExpiracao } from "./token"

export type RequestFreeSampleResult =
    | { success: true; downloadUrl?: string }
    | { success: false; error: "invalid" | "rate_limited" | "unavailable" | "unknown" }

// Janela em memória (por instância): 3 pedidos a cada 10 minutos por IP.
const limiter = rateLimit(500)
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
// Backstop persistido (cobre múltiplas instâncias serverless): 5 por hora por IP.
const DB_BACKSTOP_MAX = 5
const DB_BACKSTOP_WINDOW_MS = 60 * 60 * 1000

export async function requestFreeSample(input: unknown): Promise<RequestFreeSampleResult> {
    const parsed = freeSampleRequestSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: "invalid" }
    }
    const data = parsed.data

    // Honeypot preenchido: sucesso sem efeito algum, para não dar sinal ao bot.
    if (data.website) {
        return { success: true }
    }

    const amostra = await prisma.freeSample.findFirst({ where: { isActive: true } })
    if (!amostra) {
        // A seção só renderiza com amostra ativa, então chegar aqui significa
        // formulário de página aberta antes de o admin desligar.
        return { success: false, error: "unavailable" }
    }

    const requestHeaders = await headers()
    const ip = getClientIpFromHeaders(requestHeaders)
    const userAgent = requestHeaders.get("user-agent")?.slice(0, 500) ?? null

    try {
        await limiter.check(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)
    } catch {
        return { success: false, error: "rate_limited" }
    }

    const token = gerarToken()

    try {
        const recentes = await prisma.freeSampleDownload.count({
            where: { ip, createdAt: { gt: new Date(Date.now() - DB_BACKSTOP_WINDOW_MS) } },
        })
        if (recentes >= DB_BACKSTOP_MAX) {
            return { success: false, error: "rate_limited" }
        }

        await prisma.freeSampleDownload.create({
            data: {
                email: data.email,
                consent: data.consent,
                locale: data.locale,
                token,
                tokenExpiresAt: calcularExpiracao(new Date()),
                ip,
                userAgent,
            },
        })
    } catch (error) {
        console.error("Erro ao registrar pedido da amostra:", error)
        return { success: false, error: "unknown" }
    }

    // O download é o que a pessoa pediu, e ele NÃO depende do e-mail sair.
    // O envio do sistema é frágil (o .env pode estar autenticando num provedor
    // diferente do domínio do remetente); se dependesse dele, a falha seria
    // silenciosa — contato capturado e visitante de mãos vazias.
    let downloadUrl: string | undefined
    try {
        downloadUrl = await createFreeSampleSignedUrl(amostra.filePath)
    } catch (error) {
        console.error("Erro ao gerar URL assinada da amostra:", error)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
    const linkPorEmail = `${baseUrl}/free-sample/${token}`
    const resultadoEmail = await sendEmail(
        {
            to: data.email,
            subject: "Sua amostra do Easy Prospect",
            html: `
                <p>Obrigado pelo interesse.</p>
                <p><a href="${linkPorEmail}">Baixe a amostra aqui</a>.</p>
                <p>O link vale por sete dias.</p>
            `,
        },
        getSystemSmtpConfig()
    )
    if (!resultadoEmail.success) {
        // Vai para o Sentry pelo console.error, em vez de morrer calada.
        console.error("Falha ao enviar a cópia da amostra por e-mail:", resultadoEmail.error)
    }

    return { success: true, downloadUrl }
}
