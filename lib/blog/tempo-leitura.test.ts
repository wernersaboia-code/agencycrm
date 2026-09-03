import { describe, it, expect } from "vitest"
import { minutosDeLeitura } from "./tempo-leitura"

describe("minutosDeLeitura", () => {
    it("arredonda para cima e nunca devolve zero", () => {
        // Um post de dez palavras leva segundos, mas "0 min" nao e uma
        // informacao util para o leitor — o piso e 1.
        expect(minutosDeLeitura("uma duas tres quatro cinco seis sete oito nove dez")).toBe(1)
    })

    it("usa 200 palavras por minuto", () => {
        const texto = Array.from({ length: 400 }, () => "palavra").join(" ")
        expect(minutosDeLeitura(texto)).toBe(2)
    })

    it("ignora marcacao HTML na contagem", () => {
        // `contentHtml` vem com marcacao; contar as tags inflaria o numero.
        const texto = `<p>${Array.from({ length: 200 }, () => "palavra").join(" ")}</p>`
        expect(minutosDeLeitura(texto)).toBe(1)
    })

    it("texto vazio devolve 1, nao zero nem NaN", () => {
        expect(minutosDeLeitura("")).toBe(1)
        expect(minutosDeLeitura("   ")).toBe(1)
    })
})
