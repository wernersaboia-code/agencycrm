import { describe, expect, it } from "vitest"
import { rebaixarTitulosDoCorpo } from "./heading-levels"

describe("rebaixarTitulosDoCorpo", () => {
    it("não mexe em corpo sem h1", () => {
        const html = "<h2>Seção</h2><p>Texto</p><h3>Sub</h3>"
        expect(rebaixarTitulosDoCorpo(html)).toBe(html)
    })

    it("troca h1 por h2", () => {
        expect(rebaixarTitulosDoCorpo("<h1>Seção</h1><p>Texto</p>")).toBe("<h2>Seção</h2><p>Texto</p>")
    })

    it("desce o h2 junto para manter a hierarquia", () => {
        expect(rebaixarTitulosDoCorpo("<h1>A</h1><h2>B</h2><h3>C</h3>")).toBe("<h2>A</h2><h3>B</h3><h3>C</h3>")
    })

    it("preserva atributos", () => {
        expect(rebaixarTitulosDoCorpo('<h1 style="text-align: center">A</h1>')).toBe(
            '<h2 style="text-align: center">A</h2>',
        )
    })

    it("é idempotente", () => {
        const uma = rebaixarTitulosDoCorpo("<h1>A</h1><h2>B</h2>")
        expect(rebaixarTitulosDoCorpo(uma)).toBe(uma)
    })

    it("não confunde outras tags que começam com h1", () => {
        const html = "<p>h1 no texto</p><hr>"
        expect(rebaixarTitulosDoCorpo(html)).toBe(html)
    })
})
