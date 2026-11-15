import { describe, it, expect } from "vitest"
import { compararConteudo, LIMITE_PERDA } from "./conteudo-preservado"

const capaAntiga = "Market Entry Study\nPet Supplies Germany\nEdition 2026"
const capaNova = "easy prospect\nPet Supplies in Germany\nMarket entry study 2026"
const miolo = [
    "1. Executive Summary\nThe German pet market is mature and concentrated.",
    "2. Directory\nFressnapf Holding SE Krefeld\nZooplus SE Munich\nKölle Zoo Stuttgart",
    "3. Next Steps\nContact the distributors listed above.",
]

describe("compararConteudo", () => {
    it("aprova a troca só de capa", () => {
        const r = compararConteudo([capaAntiga, ...miolo], [capaNova, ...miolo])
        expect(r.aprovado).toBe(true)
        expect(r.palavrasFaltando).toBe(0)
        expect(r.trechosFaltando).toEqual([])
    })

    it("ignora o texto da capa antiga, que é justamente o que muda", () => {
        const r = compararConteudo([capaAntiga, ...miolo], ["", ...miolo])
        expect(r.aprovado).toBe(true)
    })

    it("aceita o miolo em outra paginação", () => {
        const r = compararConteudo([capaAntiga, ...miolo], [capaNova, miolo.join("\n")])
        expect(r.aprovado).toBe(true)
    })

    it("recusa quando some uma página do miolo e aponta as linhas perdidas", () => {
        const r = compararConteudo([capaAntiga, ...miolo], [capaNova, miolo[0], miolo[2]])
        expect(r.aprovado).toBe(false)
        expect(r.paginasAntigas).toBe(4)
        expect(r.paginasNovas).toBe(3)
        expect(r.trechosFaltando).toContain("Fressnapf Holding SE Krefeld")
        expect(r.trechosFaltando).toContain("Zooplus SE Munich")
    })

    it("recusa quando some uma única empresa do diretório", () => {
        const diretorio = Array.from({ length: 20 }, (_, i) => `Importador Numero${i} GmbH Berlin`)
        const antigo = [capaAntiga, diretorio.join("\n")]
        const novo = [capaNova, diretorio.filter((_, i) => i !== 7).join("\n")]
        const r = compararConteudo(antigo, novo)
        expect(r.aprovado).toBe(false)
        expect(r.trechosFaltando).toEqual(["Importador Numero7 GmbH Berlin"])
    })

    it("conta palavra repetida: duas ocorrências não se cobrem com uma", () => {
        const antigo = [capaAntiga, "GmbH GmbH GmbH GmbH"]
        const novo = [capaNova, "GmbH GmbH"]
        const r = compararConteudo(antigo, novo)
        expect(r.palavrasFaltando).toBe(2)
        expect(r.aprovado).toBe(false)
    })

    it("tolera diferença de caixa, acento composto e pontuação", () => {
        const antigo = [capaAntiga, "Kölle-Zoo, Stuttgart."]
        const novo = [capaNova, "KÖLLE ZOO STUTTGART"]
        expect(compararConteudo(antigo, novo).aprovado).toBe(true)
    })

    it("não tolera perda: o limite é zero", () => {
        expect(LIMITE_PERDA).toBe(0)
    })

    it("recusa uma empresa a menos mesmo num estudo grande", () => {
        // Proporção de um estudo real: ~8.500 palavras. Uma linha de diretório
        // é 0,05% — passaria em qualquer tolerância percentual.
        const corpo = Array.from({ length: 2000 }, (_, i) => `Texto${i} do estudo aqui`)
        const empresa = "Heimtierbedarf Muster GmbH Hamburg"
        const antigo = [capaAntiga, [...corpo, empresa].join("\n")]
        const novo = [capaNova, corpo.join("\n")]
        const r = compararConteudo(antigo, novo)
        expect(r.aprovado).toBe(false)
        expect(r.trechosFaltando).toEqual([empresa])
    })

    it("recusa PDF novo sem texto legível", () => {
        const r = compararConteudo([capaAntiga, ...miolo], [])
        expect(r.aprovado).toBe(false)
        expect(r.proporcaoFaltando).toBe(1)
    })

    it("aprova quando o PDF antigo só tem capa (não há miolo a preservar)", () => {
        expect(compararConteudo([capaAntiga], [capaNova]).aprovado).toBe(true)
    })

    it("limita a quantidade de trechos devolvidos", () => {
        const linhas = Array.from({ length: 100 }, (_, i) => `Linha${i} perdida`)
        const r = compararConteudo([capaAntiga, linhas.join("\n")], [capaNova])
        expect(r.trechosFaltando.length).toBeLessThanOrEqual(30)
    })
})
