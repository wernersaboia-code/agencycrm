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
    it("aceita pt, de e en", () => {
        expect(faqContactSchema.parse({ ...valid, locale: "pt" }).locale).toBe("pt")
        expect(faqContactSchema.parse({ ...valid, locale: "de" }).locale).toBe("de")
        expect(faqContactSchema.parse({ ...valid, locale: "en" }).locale).toBe("en")
    })

    // O bug que este teste evita: sem "en" no enum, o formulário de contato do
    // FAQ em inglês seria rejeitado no servidor com uma mensagem genérica de
    // erro, sem nada no cliente indicando que o problema é o locale.
    it("rejeita locale fora do enum", () => {
        expect(() => faqContactSchema.parse({ ...valid, locale: "es" })).toThrow()
    })

    it("usa de como padrão quando locale não é enviado", () => {
        expect(faqContactSchema.parse(valid).locale).toBe("de")
    })
})
