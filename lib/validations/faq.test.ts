import { describe, expect, it } from "vitest"
import { faqContactSchema } from "./faq"

const valid = {
    name: "Werner Carvalho",
    email: "werner@example.com",
    subject: "Dúvida sobre cobertura",
    message: "Preciso saber se há listas para o setor automotivo.",
    consent: true as const,
}

describe("faqContactSchema", () => {
    it("aceita pt, de, en, es, fr, it e nl", () => {
        for (const locale of ["pt", "de", "en", "es", "fr", "it", "nl"] as const) {
            expect(faqContactSchema.parse({ ...valid, locale }).locale).toBe(locale)
        }
    })

    // O bug que este teste evita: sem o locale novo no enum, o formulário de
    // contato do FAQ nesse idioma seria rejeitado no servidor com uma
    // mensagem genérica de erro, sem nada no cliente indicando que o
    // problema é o locale. "ar" segue de fora de propósito — a landing não
    // tem tradução árabe, então FaqContactForm nunca envia esse valor, mas o
    // schema do servidor precisa rejeitar mesmo assim quem tentar contornar
    // o formulário e enviar o valor direto.
    it("rejeita locale fora do enum", () => {
        expect(() => faqContactSchema.parse({ ...valid, locale: "ar" })).toThrow()
    })

    it("usa de como padrão quando locale não é enviado", () => {
        expect(faqContactSchema.parse(valid).locale).toBe("de")
    })
})
