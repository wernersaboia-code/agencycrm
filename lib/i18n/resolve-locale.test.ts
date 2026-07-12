import { describe, it, expect } from "vitest"
import { resolveSiteLocale } from "./resolve-locale"

describe("resolveSiteLocale", () => {
    it("prefere o locale explícito válido", () => {
        expect(resolveSiteLocale("de", "pt")).toBe("de")
    })
    it("cai no cookie quando não há explícito", () => {
        expect(resolveSiteLocale(undefined, "de")).toBe("de")
    })
    it("ignora valores inválidos e usa o padrão pt", () => {
        expect(resolveSiteLocale("xx", "yy")).toBe("pt")
        expect(resolveSiteLocale(undefined, undefined)).toBe("pt")
    })
})
