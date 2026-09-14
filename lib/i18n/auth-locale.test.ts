import { describe, it, expect } from "vitest"
import { resolveAuthLocale, withLangParam } from "./auth-locale"

describe("resolveAuthLocale", () => {
    it("devolve o próprio locale quando publicado", () => {
        expect(resolveAuthLocale("de")).toBe("de")
        expect(resolveAuthLocale("it")).toBe("it")
    })

    it("cai no pt para locale roteável não publicado, desconhecido ou ausente", () => {
        expect(resolveAuthLocale("ar")).toBe("pt")
        expect(resolveAuthLocale("xx")).toBe("pt")
        expect(resolveAuthLocale(undefined)).toBe("pt")
        expect(resolveAuthLocale(null)).toBe("pt")
    })
})

describe("withLangParam", () => {
    it("define lang preservando os demais params", () => {
        const out = withLangParam("redirect=%2Fcheckout&from=marketplace", "de")
        const params = new URLSearchParams(out)
        expect(params.get("redirect")).toBe("/checkout")
        expect(params.get("from")).toBe("marketplace")
        expect(params.get("lang")).toBe("de")
    })

    it("substitui um lang já presente", () => {
        const out = withLangParam("lang=pt&redirect=%2F", "fr")
        const params = new URLSearchParams(out)
        expect(params.get("lang")).toBe("fr")
        expect(params.get("redirect")).toBe("/")
    })
})
