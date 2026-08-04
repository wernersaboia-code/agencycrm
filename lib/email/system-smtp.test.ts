import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { getSystemSmtpConfig } from "./system-smtp"

const VARIAVEIS = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_SECURE",
    "SMTP_FROM_NAME",
    "SMTP_FROM_EMAIL",
    "GMAIL_USER",
    "GMAIL_APP_PASSWORD",
]

describe("getSystemSmtpConfig", () => {
    beforeEach(() => {
        for (const nome of VARIAVEIS) vi.stubEnv(nome, "")
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it("monta a configuração a partir das variáveis SMTP_*", () => {
        vi.stubEnv("SMTP_HOST", "smtp.zoho.com")
        vi.stubEnv("SMTP_PORT", "587")
        vi.stubEnv("SMTP_USER", "contato@easyprospect.com.br")
        vi.stubEnv("SMTP_PASS", "senha-de-app")
        vi.stubEnv("SMTP_SECURE", "false")
        vi.stubEnv("SMTP_FROM_NAME", "Easy Prospect")
        vi.stubEnv("SMTP_FROM_EMAIL", "contato@easyprospect.com.br")

        expect(getSystemSmtpConfig()).toEqual({
            provider: "custom",
            host: "smtp.zoho.com",
            port: 587,
            user: "contato@easyprospect.com.br",
            pass: "senha-de-app",
            secure: false,
            senderName: "Easy Prospect",
            senderEmail: "contato@easyprospect.com.br",
        })
    })

    it("sem SMTP_FROM_EMAIL, o remetente é a própria conta autenticada", () => {
        vi.stubEnv("SMTP_HOST", "smtp.zoho.com")
        vi.stubEnv("SMTP_USER", "contato@easyprospect.com.br")
        vi.stubEnv("SMTP_PASS", "senha-de-app")

        // Nunca inventar um domínio aqui: remetente fora do SPF da conta que
        // autenticou é o caminho mais curto para a caixa de spam.
        expect(getSystemSmtpConfig()?.senderEmail).toBe("contato@easyprospect.com.br")
    })

    it("cai no Gmail quando só as variáveis GMAIL_* existem", () => {
        vi.stubEnv("GMAIL_USER", "conta@gmail.com")
        vi.stubEnv("GMAIL_APP_PASSWORD", "senha-de-app")

        const config = getSystemSmtpConfig()

        expect(config?.provider).toBe("google")
        expect(config?.host).toBe("smtp.gmail.com")
        expect(config?.senderEmail).toBe("conta@gmail.com")
    })

    it("devolve null quando não há credencial nenhuma", () => {
        // null faz o sendEmail devolver erro sem enviar; um objeto com campos
        // vazios faria o nodemailer tentar conectar em undefined.
        expect(getSystemSmtpConfig()).toBeNull()
    })

    it("ignora SMTP_* pela metade", () => {
        vi.stubEnv("SMTP_HOST", "smtp.zoho.com")
        vi.stubEnv("SMTP_USER", "contato@easyprospect.com.br")
        // sem SMTP_PASS

        expect(getSystemSmtpConfig()).toBeNull()
    })
})
