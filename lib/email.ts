// lib/email.ts

import { injectTrackingIntoEmail } from '@/lib/utils/tracking.utils'
import { Resend } from "resend"
import nodemailer from "nodemailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport"
import { SMTP_PROVIDERS, type SmtpProvider } from "./constants/smtp.constants"

// Re-exportar para uso em server actions
export { SMTP_PROVIDERS, type SmtpProvider } from "./constants/smtp.constants"

// ============================================================
// TIPOS
// ============================================================

export interface SmtpConfig {
    provider: string | null
    host: string | null
    port: number | null
    user: string | null
    pass: string | null
    secure: boolean
    senderName: string | null
    senderEmail: string | null
}

export interface SendEmailParams {
    to: string
    subject: string
    html: string
    from?: string
    replyTo?: string
    tags?: { name: string; value: string }[]
    emailSendId?: string
}

export interface SendEmailResult {
    success: boolean
    id?: string
    error?: string
}

// ============================================================
// CLIENTE RESEND (fallback)
// ============================================================

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null

// ============================================================
// FUNÇÕES
// ============================================================

/**
 * Cria um transporter do Nodemailer baseado nas configurações SMTP
 */
function createSmtpTransporter(config: SmtpConfig) {
    const host = config.host || SMTP_PROVIDERS[config.provider as SmtpProvider]?.host
    const port = config.port || SMTP_PROVIDERS[config.provider as SmtpProvider]?.port || 587

    const options: SMTPTransport.Options = {
        host,
        port,
        secure: config.secure,
        auth: {
            user: config.user || "",
            pass: config.pass || "",
        },
    }

    return nodemailer.createTransport(options)
}

/**
 * Testa a conexão SMTP
 */
export async function testSmtpConnection(
    config: SmtpConfig
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!config.user || !config.pass) {
            return { success: false, error: "Email e senha são obrigatórios" }
        }

        const transporter = createSmtpTransporter(config)
        await transporter.verify()

        return { success: true }
    } catch (error) {
        console.error("Erro ao testar SMTP:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erro ao conectar",
        }
    }
}

/**
 * Envia email via SMTP do workspace
 */
export async function sendEmailSmtp(
    config: SmtpConfig,
    params: SendEmailParams
): Promise<SendEmailResult> {
    try {
        if (!config.user || !config.pass) {
            return { success: false, error: "Configurações SMTP não definidas" }
        }

        const transporter = createSmtpTransporter(config)

        const fromName = config.senderName || config.user?.split("@")[0] || "AgencyCRM"
        const fromEmail = config.senderEmail || config.user
        const from = `${fromName} <${fromEmail}>`

        console.log(`📧 Enviando email via SMTP para: ${params.to}`)
        console.log(`📧 De: ${from}`)
        console.log(`📧 Assunto: ${params.subject}`)

        const info = await transporter.sendMail({
            from,
            to: params.to,
            subject: params.subject,
            html: params.html,
            replyTo: params.replyTo || fromEmail,
        })

        console.log(`✅ Email enviado com sucesso! ID: ${info.messageId}`)
        return { success: true, id: info.messageId }
    } catch (error) {
        console.error("❌ Erro ao enviar email via SMTP:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erro ao enviar email",
        }
    }
}

/**
 * Envia email via Resend (fallback)
 */
export async function sendEmailResend(
    params: SendEmailParams
): Promise<SendEmailResult> {
    try {
        if (!resend) {
            console.warn("⚠️ RESEND_API_KEY não configurada e SMTP não disponível")
            return { success: false, error: "Nenhum método de envio configurado" }
        }

        const fromAddress = params.from || "AgencyCRM <onboarding@resend.dev>"

        console.log(`📧 Enviando email via Resend para: ${params.to}`)
        console.log(`📧 De: ${fromAddress}`)
        console.log(`📧 Assunto: ${params.subject}`)

        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: params.to,
            subject: params.subject,
            html: params.html,
            replyTo: params.replyTo,
            tags: params.tags,
        })

        if (error) {
            console.error("❌ Erro ao enviar email:", error)
            return { success: false, error: error.message }
        }

        console.log(`✅ Email enviado com sucesso! ID: ${data?.id}`)
        return { success: true, id: data?.id }
    } catch (error) {
        console.error("❌ Erro ao enviar email:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
        }
    }
}

/**
 * Função principal - decide se usa SMTP ou Resend
 */
export async function sendEmail(
    params: SendEmailParams,
    smtpConfig?: SmtpConfig | null
): Promise<SendEmailResult> {
    // Injetar tracking se emailSendId foi fornecido
    const htmlWithTracking = params.emailSendId
        ? injectTrackingIntoEmail(params.html, params.emailSendId)
        : params.html

    const paramsWithTracking = { ...params, html: htmlWithTracking }

    // Se tem configuração SMTP válida, usa SMTP
    if (smtpConfig?.user && smtpConfig?.pass) {
        return sendEmailSmtp(smtpConfig, paramsWithTracking)
    }

    // Senão, usa Resend como fallback
    return sendEmailResend(paramsWithTracking)
}

/**
 * Substitui variáveis no template
 */
export function replaceEmailVariables(
    text: string,
    data: Record<string, string | null | undefined>
): string {
    let result = text

    // Variáveis em inglês (dados do lead)
    const variables = [
        "firstName",
        "lastName",
        "fullName",
        "email",
        "phone",
        "company",
        "jobTitle",
        "industry",
        "website",
        "city",
        "state",
        "country",
        // Variáveis do remetente/workspace
        "meuNome",
        "minhaEmpresa",
        "meuEmail",
    ]

    // Substituir variáveis em inglês
    variables.forEach((key) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi")
        const value = data[key] || ""
        result = result.replace(regex, value)
    })

    // Aliases em português para variáveis do lead
    const aliases: Record<string, string> = {
        nome: "firstName",
        sobrenome: "lastName",
        nomeCompleto: "fullName",
        telefone: "phone",
        empresa: "company",
        cargo: "jobTitle",
        segmento: "industry",
        site: "website",
        cidade: "city",
        estado: "state",
        pais: "country",
    }

    // Substituir aliases em português
    Object.entries(aliases).forEach(([alias, key]) => {
        const regex = new RegExp(`{{\\s*${alias}\\s*}}`, "gi")
        const value = data[key] || ""
        result = result.replace(regex, value)
    })

    // Construir fullName se não existir
    if (!data.fullName && (data.firstName || data.lastName)) {
        const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ")
        result = result.replace(/\{\{\s*fullName\s*\}\}/gi, fullName)
        result = result.replace(/\{\{\s*nomeCompleto\s*\}\}/gi, fullName)
    }

    return result
}