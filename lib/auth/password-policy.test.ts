import { describe, it, expect } from "vitest"
import { validarSenha, PASSWORD_MIN_LENGTH } from "./password-policy"

describe("validarSenha", () => {
    it("aceita senha com 8 caracteres, letra e numero", () => {
        expect(validarSenha("prospect1")).toBeNull()
    })

    it("recusa senha curta", () => {
        expect(validarSenha("abc123")).toBe("curta")
    })

    it("recusa senha so de numeros", () => {
        // O caso que a regra existe para pegar.
        expect(validarSenha("12345678")).toBe("semLetra")
    })

    it("recusa senha so de letras", () => {
        expect(validarSenha("prospect")).toBe("semNumero")
    })

    it("reclama do tamanho antes do resto", () => {
        // Uma mensagem por vez: dizer "curta, sem letra e sem numero" de uma
        // vez so faz a pessoa reescrever tudo as cegas.
        expect(validarSenha("abc")).toBe("curta")
    })

    it("aceita letra acentuada como letra", () => {
        // \p{L} cobre alfabetos alem do ASCII — o mercado e europeu.
        expect(validarSenha("münchen1")).toBeNull()
    })

    it("aceita simbolo, sem exigir", () => {
        expect(validarSenha("prospect1!")).toBeNull()
    })

    it("conta o comprimento em caracteres visiveis", () => {
        expect(PASSWORD_MIN_LENGTH).toBe(8)
        expect(validarSenha("a1234567")).toBeNull()
    })
})
