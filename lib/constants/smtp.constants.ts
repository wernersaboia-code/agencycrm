// lib/constants/smtp.constants.ts

// ============================================================
// CONFIGURAÇÕES DE PROVEDORES SMTP
// ============================================================

export const SMTP_PROVIDERS = {
    google: {
        label: "Gmail / Google Workspace",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        imapHost: "imap.gmail.com",
        imapPort: 993,
        helpUrl: "https://support.google.com/accounts/answer/185833",
        helpText: "Use uma 'Senha de App', não sua senha normal",
    },
    zoho: {
        label: "Zoho Mail",
        host: "smtp.zoho.com",
        port: 587,
        secure: false,
        imapHost: "imap.zoho.com",
        imapPort: 993,
        helpUrl: "https://www.zoho.com/mail/help/zoho-smtp.html",
        helpText: "Use uma 'Senha de App' do Zoho",
    },
    outlook: {
        label: "Outlook / Microsoft 365",
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        imapHost: "outlook.office365.com",
        imapPort: 993,
        helpUrl: "https://support.microsoft.com/en-us/account-billing/using-app-passwords",
        helpText: "Use uma 'Senha de App' da Microsoft",
    },
    custom: {
        label: "Outro (configuração manual)",
        host: "",
        port: 587,
        secure: false,
        imapHost: "",
        imapPort: 993,
        helpUrl: "",
        helpText: "Configure manualmente o servidor SMTP",
    },
} as const

export type SmtpProvider = keyof typeof SMTP_PROVIDERS

export function getSmtpProviderConfig(provider: string) {
    return SMTP_PROVIDERS[provider as SmtpProvider] || SMTP_PROVIDERS.custom
}