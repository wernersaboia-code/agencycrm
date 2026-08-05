import { describe, it, expect } from "vitest"
import { freeSampleRequestSchema } from "./free-sample"

const valido = { email: "werner@example.com", consent: true as const, locale: "pt" as const }

describe("freeSampleRequestSchema", () => {
    it("aceita e-mail com consentimento", () => {
        expect(freeSampleRequestSchema.parse(valido).email).toBe("werner@example.com")
    })

    it("recusa e-mail inválido", () => {
        expect(() => freeSampleRequestSchema.parse({ ...valido, email: "nao-e-email" })).toThrow()
    })

    // Sem consentimento não há finalidade para guardar o endereço.
    it("recusa consentimento ausente ou falso", () => {
        expect(() => freeSampleRequestSchema.parse({ ...valido, consent: false })).toThrow()
        expect(() => freeSampleRequestSchema.parse({ email: valido.email, locale: "pt" })).toThrow()
    })

    it("aceita os sete idiomas publicados", () => {
        for (const locale of ["pt", "en", "es", "fr", "de", "it", "nl"] as const) {
            expect(freeSampleRequestSchema.parse({ ...valido, locale }).locale).toBe(locale)
        }
    })

    // O árabe é roteável mas não tem tradução da landing, então o formulário
    // nunca envia esse valor.
    it("recusa locale sem tradução", () => {
        expect(() => freeSampleRequestSchema.parse({ ...valido, locale: "ar" })).toThrow()
    })

    it("cai no pt quando o locale não vem", () => {
        expect(freeSampleRequestSchema.parse({ email: valido.email, consent: true }).locale).toBe("pt")
    })

    // Mesmo desenho do honeypot do FAQ: o schema ACEITA conteúdo aqui, e quem
    // descarta é a action. Com `.max(0)` o bot receberia erro de validação, o
    // que lhe diz que o campo é armadilha.
    it("aceita o honeypot preenchido, para a action poder fingir sucesso", () => {
        expect(() => freeSampleRequestSchema.parse({ ...valido, website: "http://spam.example" })).not.toThrow()
    })
})
