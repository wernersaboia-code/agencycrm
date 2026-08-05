// lib/free-sample/request-download.ts
"use server"

import * as Sentry from "@sentry/nextjs"
import { headers } from "next/headers"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { getSystemSmtpConfig } from "@/lib/email/system-smtp"
import { createFreeSampleSignedUrl } from "@/lib/supabase/free-sample"
import { rateLimit } from "@/lib/rate-limit"
import { getClientIpFromHeaders } from "@/lib/http/client-ip"
import { freeSampleRequestSchema } from "@/lib/validations/free-sample"
import { getPublicAppUrl } from "@/lib/env"
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

    const requestHeaders = await headers()
    const ip = getClientIpFromHeaders(requestHeaders)
    const userAgent = requestHeaders.get("user-agent")?.slice(0, 500) ?? null

    // Throttle em memória é barato e roda ANTES da consulta ao banco: assim
    // um ataque com muitos IPs não gera uma query por requisição sem limite.
    try {
        await limiter.check(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)
    } catch {
        return { success: false, error: "rate_limited" }
    }

    const amostra = await prisma.freeSample.findFirst({ where: { isActive: true } })
    if (!amostra) {
        // A seção só renderiza com amostra ativa, então chegar aqui significa
        // formulário de página aberta antes de o admin desligar.
        return { success: false, error: "unavailable" }
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

    // Tudo relacionado ao e-mail (montar a URL base, montar o link, traduzir e
    // enviar) fica dentro deste try/catch. O e-mail é cópia do download que já
    // está pronto acima; nada aqui pode custar a resposta ao visitante. Em
    // particular, getPublicAppUrl() LANÇA em produção se NEXT_PUBLIC_APP_URL
    // faltar — sem este try/catch essa exceção subiria pela action DEPOIS de
    // o pedido já estar gravado e a downloadUrl já pronta, e o cliente (que
    // faz `await requestFreeSample` sem tratamento) travaria em "enviando"
    // para sempre, sem nunca ver a URL que já existia.
    try {
        // getPublicAppUrl() e não process.env.NEXT_PUBLIC_APP_URL direto: sem a
        // variável configurada, o link viraria relativo dentro do e-mail — morto
        // fora do navegador que o abriu.
        const linkPorEmail = `${getPublicAppUrl()}/free-sample/${token}`
        const tEmail = await getTranslations({ locale: data.locale, namespace: "landing.freeSample" })
        const resultadoEmail = await sendEmail(
            {
                to: data.email,
                subject: tEmail("emailSubject"),
                html: `
                    <p>${tEmail("emailIntro")}</p>
                    <p><a href="${linkPorEmail}">${tEmail("emailLink")}</a>.</p>
                    <p>${tEmail("emailExpiry")}</p>
                `,
            },
            getSystemSmtpConfig()
        )
        if (!resultadoEmail.success) {
            // O envio de e-mail é o risco nº 1 assumido pela spec desta feature:
            // sem isto a falha morria calada no console de uma função serverless
            // que ninguém acompanha. Sentry.captureException reporta de verdade.
            //
            // O que NÃO sobe ao Sentry: a mensagem crua do provedor SMTP
            // (resultadoEmail.error). Erros de bounce costumam ecoar o
            // destinatário (ex.: "550 ... <fulano@exemplo.com>"), e o e-mail do
            // visitante foi coletado com finalidade única — mandar o arquivo —
            // não para ser espalhado a um terceiro (Sentry). O detalhe fica só
            // no console.error local, que vive no log do próprio servidor.
            console.error("Falha ao enviar a cópia da amostra por e-mail:", resultadoEmail.error)
            Sentry.captureException(new Error("Falha ao enviar a cópia da amostra por e-mail"), {
                extra: { locale: data.locale, etapa: "envio-email" },
            })
        }
    } catch (error) {
        // Qualquer exceção neste bloco (ex.: getPublicAppUrl() sem
        // NEXT_PUBLIC_APP_URL em produção) não pode custar o download que já
        // está pronto. Registra e segue — a action sempre chega ao return
        // abaixo.
        console.error("Falha ao preparar/enviar o e-mail da amostra:", error)
        Sentry.captureException(error instanceof Error ? error : new Error("Falha ao preparar/enviar o e-mail da amostra"))
    }

    return { success: true, downloadUrl }
}
