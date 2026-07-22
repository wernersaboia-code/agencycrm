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
    it("aceita pt, de, en, es e fr", () => {
        for (const locale of ["pt", "de", "en", "es", "fr"] as const) {
            expect(faqContactSchema.parse({ ...valid, locale }).locale).toBe(locale)
        }
    })

    // O bug que este teste evita: sem o locale novo no enum, o formulário de
    // contato do FAQ nesse idioma seria rejeitado no servidor com uma
    // mensagem genérica de erro, sem nada no cliente indicando que o
    // problema é o locale. "it" segue de fora de propósito — ainda não tem
    // messages/it.json.
    it("rejeita locale fora do enum", () => {
        expect(() => faqContactSchema.parse({ ...valid, locale: "it" })).toThrow()
    })

    it("usa de como padrão quando locale não é enviado", () => {
        expect(faqContactSchema.parse(valid).locale).toBe("de")
    })
})
