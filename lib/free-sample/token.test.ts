import { describe, it, expect } from "vitest"
import { gerarToken, calcularExpiracao, tokenValido, VALIDADE_TOKEN_MS } from "./token"

describe("gerarToken", () => {
    it("gera token longo o bastante para não ser adivinhado", () => {
        expect(gerarToken().length).toBeGreaterThanOrEqual(32)
    })

    it("não repete", () => {
        const tokens = new Set(Array.from({ length: 500 }, () => gerarToken()))
        expect(tokens.size).toBe(500)
    })

    // Vai numa URL de e-mail: caractere que precise de escape quebra o link em
    // clientes que reescrevem endereços.
    it("usa só caracteres seguros para URL", () => {
        for (let i = 0; i < 50; i++) {
            expect(gerarToken()).toMatch(/^[A-Za-z0-9_-]+$/)
        }
    })
})

describe("calcularExpiracao", () => {
    it("soma a validade à data dada", () => {
        const agora = new Date("2026-08-05T12:00:00.000Z")
        expect(calcularExpiracao(agora).getTime()).toBe(agora.getTime() + VALIDADE_TOKEN_MS)
    })

    it("vale sete dias", () => {
        expect(VALIDADE_TOKEN_MS).toBe(7 * 24 * 60 * 60 * 1000)
    })
})

describe("tokenValido", () => {
    const agora = new Date("2026-08-05T12:00:00.000Z")

    it("é válido antes de expirar", () => {
        expect(tokenValido(new Date(agora.getTime() + 1000), agora)).toBe(true)
    })

    it("é inválido depois de expirar", () => {
        expect(tokenValido(new Date(agora.getTime() - 1000), agora)).toBe(false)
    })

    // Limite exato: expirar "agora" já não vale. O contrário deixaria uma
    // janela de um milissegundo que ninguém consegue testar em produção.
    it("é inválido no instante exato da expiração", () => {
        expect(tokenValido(agora, agora)).toBe(false)
    })
})
