"use server"

import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { sendEmailResend } from "@/lib/email"
import { rateLimit } from "@/lib/rate-limit"
import { faqContactSchema } from "@/lib/validations/faq"

export interface SubmitFaqResult {
    success: boolean
    error?: "invalid" | "rate_limited" | "unknown"
}

// Janela deslizante em memória (por instância): 3 envios a cada 10 minutos por IP.
const limiter = rateLimit(500)
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
// Backstop persistido (cobre múltiplas instâncias serverless): 5 envios por hora por IP.
const DB_BACKSTOP_MAX = 5
const DB_BACKSTOP_WINDOW_MS = 60 * 60 * 1000

function getClientIpFromHeaders(h: Headers): string {
    const forwarded = h.get("x-forwarded-for")
    if (forwarded) {
        return forwarded.split(",")[0].trim()
    }
    return h.get("x-real-ip") || "anonymous"
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
}

export async function submitFaqQuestion(input: unknown): Promise<SubmitFaqResult> {
    const parsed = faqContactSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: "invalid" }
    }

    const data = parsed.data

    // Honeypot preenchido: responder sucesso sem efeito algum, para não dar sinal ao bot.
    if (data.website) {
        return { success: true }
    }

    const requestHeaders = await headers()
    const ip = getClientIpFromHeaders(requestHeaders)
    const userAgent = requestHeaders.get("user-agent")?.slice(0, 500) ?? null

    try {
        await limiter.check(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)
    } catch {
        return { success: false, error: "rate_limited" }
    }

    try {
        const recentCount = await prisma.faqSubmission.count({
            where: {
                ip,
                createdAt: { gt: new Date(Date.now() - DB_BACKSTOP_WINDOW_MS) },
            },
        })
        if (recentCount >= DB_BACKSTOP_MAX) {
            return { success: false, error: "rate_limited" }
        }

        await prisma.faqSubmission.create({
            data: {
                name: data.name,
                company: data.company || null,
                email: data.email,
                subject: data.subject,
                message: data.message,
                consent: data.consent,
                locale: data.locale,
                ip,
                userAgent,
            },
        })
    } catch (error) {
        console.error("Erro ao salvar pergunta do FAQ:", error)
        return { success: false, error: "unknown" }
    }

    const notifyTo = process.env.FAQ_CONTACT_EMAIL
    if (notifyTo) {
        const html = `
            <h2>Nova pergunta pelo formulário de FAQ</h2>
            <p><strong>Nome:</strong> ${escapeHtml(data.name)}</p>
            <p><strong>Empresa:</strong> ${escapeHtml(data.company || "—")}</p>
            <p><strong>E-mail:</strong> ${escapeHtml(data.email)}</p>
            <p><strong>Idioma:</strong> ${escapeHtml(data.locale)}</p>
            <p><strong>Assunto:</strong> ${escapeHtml(data.subject)}</p>
            <p><strong>Pergunta:</strong></p>
            <p>${escapeHtml(data.message).replace(/\n/g, "<br />")}</p>
        `

        // Falha no e-mail não falha a submissão: a pergunta já está persistida.
        const result = await sendEmailResend({
            to: notifyTo,
            subject: `[FAQ] ${data.subject}`,
            html,
            replyTo: data.email,
        })
        if (!result.success) {
            console.error("Falha ao notificar pergunta do FAQ por e-mail:", result.error)
        }
    } else {
        console.warn("FAQ_CONTACT_EMAIL não configurado — pergunta salva sem notificação por e-mail")
    }

    return { success: true }
}
