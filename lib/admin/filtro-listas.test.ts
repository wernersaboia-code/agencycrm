import { describe, it, expect } from "vitest"
import { filtrarListas, temFiltroAtivo, type ListaFiltravel } from "./filtro-listas"

function lista(over: Partial<ListaFiltravel> = {}): ListaFiltravel {
    return {
        name: "HoReCa & Foodservice Market - Portugal",
        slug: "horeca-foodservice-market-portugal",
        countries: ["PT"],
        industries: ["horeca"],
        isActive: true,
        isFeatured: false,
        studyPdfUrl: "https://exemplo/estudo.pdf",
        ...over,
    }
}

const CATALOGO: ListaFiltravel[] = [
    lista(),
    lista({
        name: "Mercado de Frutas Exóticas - Alemanha",
        slug: "mercado-de-frutas-exoticas-alemanha",
        countries: ["DE"],
        industries: ["exotic_fruits"],
        isFeatured: true,
    }),
    lista({
        name: "FMCG Market - Netherlands",
        slug: "fmcg-market-netherlands",
        countries: ["NL"],
        industries: ["fmcg"],
        isActive: false,
        studyPdfUrl: null,
    }),
]

const nomes = (r: ListaFiltravel[]) => r.map((l) => l.name)

describe("filtrarListas", () => {
    it("devolve tudo sem filtro", () => {
        expect(filtrarListas(CATALOGO, {})).toHaveLength(3)
    })

    it("busca por nome", () => {
        expect(nomes(filtrarListas(CATALOGO, { q: "netherlands" }))).toEqual([
            "FMCG Market - Netherlands",
        ])
    })

    it("busca por slug", () => {
        expect(nomes(filtrarListas(CATALOGO, { q: "horeca-foodservice" }))).toEqual([
            "HoReCa & Foodservice Market - Portugal",
        ])
    })

    // O catálogo é multilíngue e o admin digita do teclado que tem à mão:
    // "exoticas" sem acento tem de achar "Frutas Exóticas".
    it("ignora acento na busca", () => {
        expect(nomes(filtrarListas(CATALOGO, { q: "frutas exoticas" }))).toEqual([
            "Mercado de Frutas Exóticas - Alemanha",
        ])
    })

    it("ignora caixa na busca", () => {
        expect(filtrarListas(CATALOGO, { q: "FMCG" })).toHaveLength(1)
    })

    it("filtra por país", () => {
        expect(nomes(filtrarListas(CATALOGO, { country: "DE" }))).toEqual([
            "Mercado de Frutas Exóticas - Alemanha",
        ])
    })

    it("filtra por setor", () => {
        expect(nomes(filtrarListas(CATALOGO, { industry: "horeca" }))).toEqual([
            "HoReCa & Foodservice Market - Portugal",
        ])
    })

    it("combina busca e país", () => {
        expect(filtrarListas(CATALOGO, { q: "market", country: "NL" })).toHaveLength(1)
        expect(filtrarListas(CATALOGO, { q: "frutas", country: "NL" })).toHaveLength(0)
    })

    describe("status", () => {
        it("active traz só as publicadas", () => {
            expect(filtrarListas(CATALOGO, { status: "active" })).toHaveLength(2)
        })

        it("inactive traz só as despublicadas", () => {
            expect(nomes(filtrarListas(CATALOGO, { status: "inactive" }))).toEqual([
                "FMCG Market - Netherlands",
            ])
        })

        it("noPdf traz a lista sem estudo anexado", () => {
            expect(nomes(filtrarListas(CATALOGO, { status: "noPdf" }))).toEqual([
                "FMCG Market - Netherlands",
            ])
        })

        it("featured traz só as promovidas", () => {
            expect(nomes(filtrarListas(CATALOGO, { status: "featured" }))).toEqual([
                "Mercado de Frutas Exóticas - Alemanha",
            ])
        })

        it("status desconhecido não filtra nada", () => {
            // Valor vindo de link editado à mão não pode esvaziar a tabela
            // sem explicação.
            expect(filtrarListas(CATALOGO, { status: "xpto" })).toHaveLength(3)
        })
    })
})

describe("temFiltroAtivo", () => {
    it("é falso sem filtro", () => {
        expect(temFiltroAtivo({})).toBe(false)
    })

    // Distingue "catálogo vazio" de "filtro sem resultado": no segundo caso a
    // tabela não deve convidar a criar uma lista que provavelmente já existe.
    it("é verdadeiro com qualquer um dos filtros", () => {
        expect(temFiltroAtivo({ q: "abc" })).toBe(true)
        expect(temFiltroAtivo({ country: "DE" })).toBe(true)
        expect(temFiltroAtivo({ industry: "fmcg" })).toBe(true)
        expect(temFiltroAtivo({ status: "active" })).toBe(true)
    })

    it("ignora busca só com espaço", () => {
        expect(temFiltroAtivo({ q: "   " })).toBe(false)
    })
})
