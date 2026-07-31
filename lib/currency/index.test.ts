import { describe, it, expect } from "vitest"
import {
    SUPPORTED_CURRENCIES,
    DEFAULT_CURRENCY,
    parseCurrency,
    guessCurrency,
    decideCurrencyCookie,
} from "./index"

describe("SUPPORTED_CURRENCIES", () => {
    it("são exatamente EUR, BRL e USD", () => {
        expect([...SUPPORTED_CURRENCIES]).toEqual(["EUR", "BRL", "USD"])
    })

    it("tem EUR como padrão — é a única moeda obrigatória por lista", () => {
        expect(DEFAULT_CURRENCY).toBe("EUR")
    })
})

describe("parseCurrency", () => {
    it("aceita código suportado", () => {
        expect(parseCurrency("BRL")).toBe("BRL")
    })

    it("aceita minúsculas — o Stripe devolve a moeda assim", () => {
        expect(parseCurrency("usd")).toBe("USD")
    })

    it("recusa moeda não suportada em vez de cair no padrão", () => {
        expect(parseCurrency("GBP")).toBeNull()
    })

    it("recusa vazio, nulo e indefinido", () => {
        expect(parseCurrency("")).toBeNull()
        expect(parseCurrency(null)).toBeNull()
        expect(parseCurrency(undefined)).toBeNull()
    })
})

describe("guessCurrency", () => {
    it("Brasil vê real", () => {
        expect(guessCurrency({ country: "BR", locale: "de" })).toBe("BRL")
    })

    it("Estados Unidos e Canadá veem dólar", () => {
        expect(guessCurrency({ country: "US", locale: "pt" })).toBe("USD")
        expect(guessCurrency({ country: "CA", locale: "pt" })).toBe("USD")
    })

    it("o resto do mundo vê euro", () => {
        expect(guessCurrency({ country: "DE", locale: "pt" })).toBe("EUR")
        expect(guessCurrency({ country: "JP", locale: "en" })).toBe("EUR")
    })

    it("a geografia manda sobre o idioma: alemão morando no Brasil vê real", () => {
        expect(guessCurrency({ country: "BR", locale: "de" })).toBe("BRL")
    })

    it("sem país, cai no idioma", () => {
        expect(guessCurrency({ country: null, locale: "pt" })).toBe("BRL")
        expect(guessCurrency({ country: null, locale: "en" })).toBe("USD")
        expect(guessCurrency({ country: null, locale: "fr" })).toBe("EUR")
    })

    it("sem país e sem idioma, cai no padrão", () => {
        expect(guessCurrency({})).toBe("EUR")
    })

    it("país em minúsculas conta igual", () => {
        expect(guessCurrency({ country: "br" })).toBe("BRL")
    })
})

describe("decideCurrencyCookie", () => {
    it("não regrava quando o cookie já existe — escolha da pessoa não é sobrescrita", () => {
        expect(decideCurrencyCookie({ existing: "EUR", country: "BR", pathname: "/catalog" })).toBeNull()
    })

    it("grava o palpite quando não há cookie", () => {
        expect(decideCurrencyCookie({ existing: null, country: "BR", pathname: "/catalog" })).toBe("BRL")
    })

    it("cookie com valor inválido é tratado como ausente", () => {
        expect(decideCurrencyCookie({ existing: "GBP", country: "US", pathname: "/catalog" })).toBe("USD")
    })

    it("sem país, usa o idioma do caminho", () => {
        expect(decideCurrencyCookie({ existing: null, country: null, pathname: "/en/catalog" })).toBe("USD")
        expect(decideCurrencyCookie({ existing: null, country: null, pathname: "/de/catalog" })).toBe("EUR")
    })

    it("caminho sem prefixo de idioma é português (o locale padrão do site)", () => {
        expect(decideCurrencyCookie({ existing: null, country: null, pathname: "/catalog" })).toBe("BRL")
    })
})
