import { describe, it, expect } from "vitest"
import { buildUnsubscribeUrl, buildListUnsubscribeHeaders } from "./list-unsubscribe"

describe("buildUnsubscribeUrl", () => {
    it("monta a URL com sid e sig", () => {
        expect(buildUnsubscribeUrl("https://app.exemplo.com", "send-1", "abc123")).toBe(
            "https://app.exemplo.com/unsubscribe?sid=send-1&sig=abc123"
        )
    })

    it("remove a barra final do baseUrl", () => {
        expect(buildUnsubscribeUrl("https://app.exemplo.com/", "s", "g")).toBe(
            "https://app.exemplo.com/unsubscribe?sid=s&sig=g"
        )
    })

    it("escapa valores com caracteres especiais", () => {
        expect(buildUnsubscribeUrl("https://x.com", "a b", "c&d")).toBe(
            "https://x.com/unsubscribe?sid=a%20b&sig=c%26d"
        )
    })
})

describe("buildListUnsubscribeHeaders", () => {
    it("inclui a URL entre colchetes angulares e o header de one-click", () => {
        expect(buildListUnsubscribeHeaders("https://x.com/unsubscribe?sid=1&sig=2")).toEqual(
            {
                "List-Unsubscribe": "<https://x.com/unsubscribe?sid=1&sig=2>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            }
        )
    })

    it("põe o mailto antes da URL quando informado", () => {
        const headers = buildListUnsubscribeHeaders(
            "https://x.com/u",
            "baixa@exemplo.com"
        )
        expect(headers["List-Unsubscribe"]).toBe(
            "<mailto:baixa@exemplo.com>, <https://x.com/u>"
        )
    })

    it("ignora mailto vazio", () => {
        const headers = buildListUnsubscribeHeaders("https://x.com/u", "  ")
        expect(headers["List-Unsubscribe"]).toBe("<https://x.com/u>")
    })
})