import { describe, it, expect } from "vitest"
import { PUBLISHED_LOCALES } from "@/lib/i18n/locales"

const TITLE_SUFFIX = " | Easy Prospect"
const MAX_TITLE = 60
const MAX_DESCRIPTION = 155

describe("comprimento da metadata da landing", () => {
    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale}: title cabe no limite de SERP com o sufixo da marca`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default
            const title = messages.landing.meta.title

            expect((title + TITLE_SUFFIX).length).toBeLessThanOrEqual(MAX_TITLE)
        })

        it(`${locale}: description cabe no limite de SERP`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default

            expect(messages.landing.meta.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION)
        })
    }
})
