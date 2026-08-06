import { describe, it, expect } from "vitest"
import { PUBLISHED_LOCALES } from "./locales"

// Todas as chaves do namespace `emails`. E o teste que pega a traducao
// esquecida, que e o modo mais provavel de isso quebrar: o e-mail sai, so que
// no idioma errado, e ninguem percebe ate um cliente reclamar.
const REQUIRED_PATHS = [
    "common.tagline",
    "common.support",
    "signup.subject",
    "signup.heading",
    "signup.greeting",
    "signup.intro",
    "signup.button",
    "signup.expires",
    "signup.ignore",
    "accountExists.subject",
    "accountExists.heading",
    "accountExists.greeting",
    "accountExists.intro",
    "accountExists.button",
    "accountExists.resetHint",
    "accountExists.ignore",
    "purchase.subject",
    "purchase.heading",
    "purchase.greeting",
    "purchase.intro",
    "purchase.orderLabel",
    "purchase.dateLabel",
    "purchase.totalLabel",
    "purchase.itemsTitle",
    "purchase.accessIntro",
    "purchase.accessButton",
    "purchase.linkNote",
    "purchase.catalogTitle",
    "purchase.catalogText",
    "purchase.catalogButton",
]

function get(obj: unknown, path: string): unknown {
    return path.split(".").reduce<unknown>((acc, key) => {
        if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key]
        return undefined
    }, obj)
}

describe("namespace emails nos locales publicados", () => {
    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale} tem todas as chaves de emails preenchidas`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default
            for (const path of REQUIRED_PATHS) {
                const value = get((messages as Record<string, unknown>).emails, path)
                expect(typeof value, `${locale} → emails.${path}`).toBe("string")
                expect((value as string).length, `${locale} → emails.${path}`).toBeGreaterThan(0)
            }
        })
    }
})

describe("placeholders do namespace emails", () => {
    // Um {nome} que virou {name} na traducao aparece cru no e-mail do
    // comprador. O teste compara contra o portugues, que e a fonte.
    const COM_PLACEHOLDER: Array<[string, string]> = [
        ["signup.greeting", "{nome}"],
        ["purchase.greeting", "{nome}"],
        ["purchase.subject", "{pedido}"],
    ]

    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale} preserva os placeholders`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default
            for (const [path, placeholder] of COM_PLACEHOLDER) {
                const value = get((messages as Record<string, unknown>).emails, path) as string
                expect(value, `${locale} → emails.${path}`).toContain(placeholder)
            }
        })
    }
})
