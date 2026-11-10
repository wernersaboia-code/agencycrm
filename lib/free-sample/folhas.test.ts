import { describe, it, expect } from "vitest"
import { escolherFolhas } from "./folhas"

const paginas = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`)

describe("escolherFolhas", () => {
    it("pula a capa e espalha três páginas pelo miolo", () => {
        expect(escolherFolhas(paginas(12))).toEqual(["p2", "p7", "p12"])
    })

    it("com quatro páginas, usa as três de dentro sem repetir", () => {
        expect(escolherFolhas(paginas(4))).toEqual(["p2", "p3", "p4"])
    })

    it("com menos de quatro páginas não mostra nada", () => {
        expect(escolherFolhas(paginas(3))).toEqual([])
        expect(escolherFolhas([])).toEqual([])
    })
})
