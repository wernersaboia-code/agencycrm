import { describe, expect, it } from "vitest"
import { routing } from "./routing"

describe("routing", () => {
    it("usa pt como padrão sem prefixo", () => {
        expect(routing.defaultLocale).toBe("pt")
        expect(routing.localePrefix).toBe("as-needed")
    })

    it("expõe os 8 locales", () => {
        expect(routing.locales).toEqual(["pt", "de", "en", "es", "fr", "ar", "it", "nl"])
    })
})
