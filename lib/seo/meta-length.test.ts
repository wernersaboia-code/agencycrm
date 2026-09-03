import { describe, it, expect } from "vitest"
import { PUBLISHED_LOCALES } from "@/lib/i18n/locales"
import {
    MAX_DESCRIPTION,
    MAX_TITULO_PROPRIO,
    TITLE_SUFFIX,
    descricaoCabeNaSerp,
    tituloCabeNaSerp,
} from "./meta-length"

describe("comprimento da metadata da landing", () => {
    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale}: title cabe no limite de SERP com o sufixo da marca`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default

            expect(tituloCabeNaSerp(messages.landing.meta.title)).toBe(true)
        })

        it(`${locale}: description cabe no limite de SERP`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default

            expect(descricaoCabeNaSerp(messages.landing.meta.description)).toBe(true)
        })
    }
})

describe("limites de SERP", () => {
    it("o título é medido junto com o sufixo da marca", () => {
        const noLimite = "a".repeat(MAX_TITULO_PROPRIO)

        expect(tituloCabeNaSerp(noLimite)).toBe(true)
        expect(tituloCabeNaSerp(noLimite + "a")).toBe(false)
        expect((noLimite + TITLE_SUFFIX).length).toBe(60)
    })

    it("a descrição é medida sozinha", () => {
        expect(descricaoCabeNaSerp("a".repeat(MAX_DESCRIPTION))).toBe(true)
        expect(descricaoCabeNaSerp("a".repeat(MAX_DESCRIPTION + 1))).toBe(false)
    })
})
