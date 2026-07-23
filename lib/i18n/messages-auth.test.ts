import { describe, it, expect } from "vitest"
import { PUBLISHED_LOCALES } from "./locales"

const REQUIRED_PATHS = [
    "backToHome",
    "language",
    "signIn.mainAccess",
    "signIn.cardDescription",
    "signIn.areas.purchases.title",
    "signIn.areas.admin.button",
    "signIn.areas.crm.shortTitle",
    "signIn.errLinkExpired",
    "signUp.mktTitle",
    "signUp.benefitsTitle",
    "signUp.step3",
]

function get(obj: unknown, path: string): unknown {
    return path.split(".").reduce<unknown>((acc, key) => {
        if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key]
        return undefined
    }, obj)
}

describe("namespace auth nos locales publicados", () => {
    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale} tem todas as chaves de auth preenchidas`, async () => {
            const messages = (await import(`../../messages/${locale}.json`)).default
            for (const path of REQUIRED_PATHS) {
                const value = get((messages as Record<string, unknown>).auth, path)
                expect(typeof value, `${locale} → auth.${path}`).toBe("string")
                expect((value as string).length, `${locale} → auth.${path}`).toBeGreaterThan(0)
            }
        })
    }
})
