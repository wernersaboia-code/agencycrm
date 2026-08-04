// lib/email/system-smtp.ts

import type { SmtpConfig } from "@/lib/email"
import { SMTP_PROVIDERS } from "@/lib/constants/smtp.constants"

/**
 * Configuração SMTP do PRÓPRIO sistema (variáveis de ambiente), usada nos
 * e-mails que o Easy Prospect manda em nome próprio: confirmação de compra,
 * aviso de pergunta no FAQ. Não confundir com o SMTP por workspace, que é
 * credencial do cliente e vive criptografada no banco.
 *
 * Devolve `null` quando não há credencial nenhuma — o `sendEmail` trata isso
 * devolvendo erro, sem enviar. Devolver um objeto vazio faria o nodemailer
 * tentar conectar em `undefined` e falhar com um erro obscuro bem mais tarde.
 */
export function getSystemSmtpConfig(): SmtpConfig | null {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return {
            provider: "custom",
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
            secure: process.env.SMTP_SECURE === "true",
            senderName: process.env.SMTP_FROM_NAME || "Easy Prospect",
            // Precisa bater com a conta autenticada no SMTP: a maioria dos
            // provedores rejeita (ou marca como spam) um From de domínio
            // diferente do que fez login. É também o que o SPF do domínio
            // autoriza.
            senderEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        }
    }

    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        return {
            provider: "google",
            host: SMTP_PROVIDERS.google.host,
            port: SMTP_PROVIDERS.google.port,
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
            secure: SMTP_PROVIDERS.google.secure,
            senderName: "Easy Prospect",
            senderEmail: process.env.GMAIL_USER,
        }
    }

    return null
}
