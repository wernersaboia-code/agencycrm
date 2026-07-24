import { describe, it, expect } from "vitest"
import { buildOrganizationSchema, buildWebSiteSchema, buildFaqSchema, BASE_URL } from "./schema"
import { PUBLISHED_LOCALES } from "@/lib/i18n/locales"

describe("buildOrganizationSchema", () => {
    it("identifica a organização com @id estável e url absoluta", () => {
        const schema = buildOrganizationSchema()

        expect(schema["@context"]).toBe("https://schema.org")
        expect(schema["@type"]).toBe("Organization")
        expect(schema["@id"]).toBe(`${BASE_URL}#organization`)
        expect(schema.name).toBe("Easy Prospect")
        expect(schema.url).toBe(BASE_URL)
    })

    it("usa logo absoluto", () => {
        const schema = buildOrganizationSchema()
        expect(String(schema.logo)).toContain(BASE_URL)
    })
})

describe("buildWebSiteSchema", () => {
    it("aponta o publisher para a organização pelo @id", () => {
        const schema = buildWebSiteSchema()

        expect(schema["@type"]).toBe("WebSite")
        expect(schema.url).toBe(BASE_URL)
        expect(schema.publisher).toEqual({ "@id": `${BASE_URL}#organization` })
    })
})

describe("buildFaqSchema", () => {
    it("mapeia cada par pergunta/resposta para Question + Answer", () => {
        const schema = buildFaqSchema([
            { question: "Como recebo a lista?", answer: "Por download em PDF." },
        ])

        expect(schema["@type"]).toBe("FAQPage")
        expect(schema.mainEntity).toEqual([
            {
                "@type": "Question",
                name: "Como recebo a lista?",
                acceptedAnswer: { "@type": "Answer", text: "Por download em PDF." },
            },
        ])
    })

    it("ignora itens sem pergunta ou sem resposta", () => {
        const schema = buildFaqSchema([
            { question: "Válida?", answer: "Sim." },
            { question: "", answer: "Sem pergunta" },
            { question: "Sem resposta", answer: "" },
        ])

        expect((schema.mainEntity as unknown[]).length).toBe(1)
    })
})

describe("integridade do conteúdo do FAQ", () => {
    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale}: nenhuma resposta do FAQ é placeholder`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default
            const items = messages.faq.items as { question: string; answer: string }[]

            for (const item of items) {
                expect(item.answer).not.toContain("PLACEHOLDER")
            }

            // A resposta sobre LGPD/GDPR continua deliberadamente em branco (o texto
            // jurídico ainda não foi redigido) e buildFaqSchema a descarta do markup.
            // Todas as outras precisam existir de fato.
            const preenchidas = items.filter((item) => item.answer.trim().length > 0)
            expect(preenchidas.length).toBeGreaterThanOrEqual(items.length - 1)
        })
    }
})
