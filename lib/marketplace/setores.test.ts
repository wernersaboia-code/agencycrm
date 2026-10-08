import { describe, expect, it } from "vitest"
import {
    IDIOMAS_DO_SETOR,
    mapaDeNomes,
    nomeDoSetor,
    nomesDosSetoresDaLista,
    rotularSetores,
    setorCriacaoSchema,
    sugerirSlug,
    type Setor,
} from "./setores"

const SETORES: Setor[] = [
    { id: "horeca", labels: { pt: "HoReCa & Foodservice", de: "HoReCa & Foodservice" }, sortOrder: 10 },
    { id: "toys", labels: { pt: "Brinquedos", de: "Spielwaren" }, sortOrder: 20 },
    { id: "fmcg", labels: { pt: "FMCG", de: "FMCG" }, sortOrder: 30 },
]

const nomesCompletos = Object.fromEntries(IDIOMAS_DO_SETOR.map((idioma) => [idioma, `Pet Food ${idioma}`]))

describe("nomeDoSetor", () => {
    it("usa o nome do idioma da página", () => {
        expect(nomeDoSetor(SETORES[1], "toys", "de")).toBe("Spielwaren")
    })

    it("cai no português quando o idioma não tem nome (ex.: ar)", () => {
        expect(nomeDoSetor(SETORES[1], "toys", "ar")).toBe("Brinquedos")
    })

    it("mostra o slug quando o setor saiu do cadastro", () => {
        expect(nomeDoSetor(undefined, "agriculture", "pt")).toBe("agriculture")
    })
})

describe("nomesDosSetoresDaLista", () => {
    it("segue a ordem do cadastro, não a ordem em que foram marcados", () => {
        expect(nomesDosSetoresDaLista(["fmcg", "horeca"], SETORES, "pt")).toEqual([
            "HoReCa & Foodservice",
            "FMCG",
        ])
    })

    it("põe setor fora do cadastro no fim, pelo slug", () => {
        expect(nomesDosSetoresDaLista(["agriculture", "toys"], SETORES, "de")).toEqual([
            "Spielwaren",
            "agriculture",
        ])
    })
})

describe("rotularSetores e mapaDeNomes", () => {
    it("rotulam no idioma pedido", () => {
        expect(rotularSetores(SETORES, "de").map((setor) => setor.nome)).toEqual([
            "HoReCa & Foodservice",
            "Spielwaren",
            "FMCG",
        ])
        expect(mapaDeNomes(SETORES, "pt").toys).toBe("Brinquedos")
    })
})

describe("setorCriacaoSchema", () => {
    it("aceita slug válido com nome nos sete idiomas", () => {
        expect(setorCriacaoSchema.safeParse({ id: "pet_food", labels: nomesCompletos }).success).toBe(true)
    })

    it("recusa nome faltando em algum idioma publicado", () => {
        const incompletos = { ...nomesCompletos }
        delete incompletos.nl
        expect(setorCriacaoSchema.safeParse({ id: "pet_food", labels: incompletos }).success).toBe(false)
    })

    it.each(["Pet_Food", "pet-food", "1pet", "p", "pet food"])("recusa o slug %s", (id) => {
        expect(setorCriacaoSchema.safeParse({ id, labels: nomesCompletos }).success).toBe(false)
    })
})

describe("sugerirSlug", () => {
    it("tira acento, troca separadores por _ e não começa com dígito", () => {
        expect(sugerirSlug("Pet Food & Supplies")).toBe("pet_food_supplies")
        expect(sugerirSlug("Café Torrado")).toBe("cafe_torrado")
        expect(sugerirSlug("3D Printing")).toBe("d_printing")
    })
})
