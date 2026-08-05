import { describe, it, expect } from "vitest"
import { getClientIpFromHeaders } from "./client-ip"

describe("getClientIpFromHeaders", () => {
    it("lê x-forwarded-for", () => {
        expect(getClientIpFromHeaders(new Headers({ "x-forwarded-for": "203.0.113.1" })))
            .toBe("203.0.113.1")
    })

    // A cadeia de proxies vem em ordem: o cliente original é o primeiro.
    // Pegar o último devolveria o IP do nosso próprio proxy, e o rate limit
    // passaria a contar o mundo inteiro num balde só.
    it("pega o primeiro da cadeia de proxies", () => {
        expect(getClientIpFromHeaders(new Headers({ "x-forwarded-for": "203.0.113.1, 70.41.3.18, 150.172.238.178" })))
            .toBe("203.0.113.1")
    })

    it("apara espaço em volta", () => {
        expect(getClientIpFromHeaders(new Headers({ "x-forwarded-for": "  203.0.113.1  , 70.41.3.18" })))
            .toBe("203.0.113.1")
    })

    it("cai para x-real-ip", () => {
        expect(getClientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.7" })))
            .toBe("198.51.100.7")
    })

    it("prefere x-forwarded-for quando os dois vêm", () => {
        expect(getClientIpFromHeaders(new Headers({
            "x-forwarded-for": "203.0.113.1",
            "x-real-ip": "198.51.100.7",
        }))).toBe("203.0.113.1")
    })

    it("devolve anonymous sem header nenhum", () => {
        expect(getClientIpFromHeaders(new Headers())).toBe("anonymous")
    })
})
