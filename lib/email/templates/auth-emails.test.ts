import { describe, it, expect } from "vitest"
import { generateSignupConfirmationEmail } from "./signup-confirmation"
import { generateAccountExistsEmail } from "./account-exists"

const CONFIRM_URL = "https://www.easyprospect.com.br/auth/confirm?token_hash=abc&next=%2Fmy-purchases"
const SIGN_IN_URL = "https://www.easyprospect.com.br/sign-in?lang=de"

describe("generateSignupConfirmationEmail", () => {
    it("sai em alemao quando o locale e de", async () => {
        const { subject, html } = await generateSignupConfirmationEmail(
            { userName: "Heitor", confirmUrl: CONFIRM_URL },
            "de"
        )

        expect(subject).toBe("Bestätigen Sie Ihre E-Mail-Adresse — Easy Prospect")
        expect(html).toContain("Hallo Heitor")
        expect(html).toContain("E-Mail-Adresse bestätigen")
    })

    it("sai em portugues quando o locale e pt", async () => {
        const { subject, html } = await generateSignupConfirmationEmail(
            { userName: "Werner", confirmUrl: CONFIRM_URL },
            "pt"
        )

        expect(subject).toContain("Confirme seu e-mail")
        expect(html).toContain("Olá Werner")
    })

    it("leva o link de confirmacao", async () => {
        const { html } = await generateSignupConfirmationEmail(
            { userName: "Werner", confirmUrl: CONFIRM_URL },
            "pt"
        )

        expect(html).toContain(CONFIRM_URL)
    })

    it("nao deixa placeholder cru", async () => {
        const { subject, html } = await generateSignupConfirmationEmail(
            { userName: "Werner", confirmUrl: CONFIRM_URL },
            "nl"
        )

        expect(subject).not.toMatch(/\{\w+\}/)
        expect(html).not.toMatch(/\{\w+\}/)
    })
})

describe("generateAccountExistsEmail", () => {
    it("sai no idioma pedido", async () => {
        const { subject, html } = await generateAccountExistsEmail({ signInUrl: SIGN_IN_URL }, "de")

        expect(subject).toBe("Sie haben bereits ein Konto — Easy Prospect")
        expect(html).toContain("Bei meinem Konto anmelden")
    })

    it("leva o link de entrada e nenhum link de confirmacao", async () => {
        // Este e-mail nunca pode carregar token: ele vai para o dono do
        // endereco depois de UMA TENTATIVA de terceiro. Um link de confirmacao
        // aqui entregaria a conta a quem tentou o cadastro.
        const { html } = await generateAccountExistsEmail({ signInUrl: SIGN_IN_URL }, "pt")

        expect(html).toContain(SIGN_IN_URL)
        expect(html).not.toContain("token_hash")
    })

    it("nao trata o destinatario pelo nome", async () => {
        // Nao sabemos quem tentou o cadastro, e o nome digitado por um
        // terceiro nao deve aparecer no e-mail do titular.
        const { html } = await generateAccountExistsEmail({ signInUrl: SIGN_IN_URL }, "pt")

        expect(html).toContain("Olá,")
    })
})
