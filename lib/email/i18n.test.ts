import { describe, it, expect } from "vitest"
import { interpolate, loadEmailBlock, loadEmailCommon } from "./i18n"

describe("interpolate", () => {
    it("troca o placeholder pelo valor", () => {
        expect(interpolate("Olá {nome},", { nome: "Werner" })).toBe("Olá Werner,")
    })

    it("troca todas as ocorrências do mesmo placeholder", () => {
        expect(interpolate("{a} e {a}", { a: "x" })).toBe("x e x")
    })

    it("deixa intacto o placeholder sem valor", () => {
        // Melhor deixar visivel do que trocar por "undefined": quem ler o
        // e-mail de teste percebe na hora que faltou passar a variavel.
        expect(interpolate("Olá {nome},", {})).toBe("Olá {nome},")
    })

    it("nao quebra com texto sem placeholder", () => {
        expect(interpolate("Compra confirmada", { nome: "x" })).toBe("Compra confirmada")
    })
})

describe("loadEmailBlock", () => {
    it("devolve o bloco no idioma pedido", async () => {
        const bloco = await loadEmailBlock("de", "signup")
        expect(bloco.button).toBe("E-Mail-Adresse bestätigen")
    })

    it("devolve o bloco do e-mail de compra", async () => {
        const bloco = await loadEmailBlock("nl", "purchase")
        expect(bloco.heading).toBe("Aankoop bevestigd")
    })
})

describe("loadEmailCommon", () => {
    it("devolve o rodape no idioma pedido", async () => {
        const comum = await loadEmailCommon("fr")
        expect(comum.support).toContain("support")
    })
})
