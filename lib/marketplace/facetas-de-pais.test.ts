import { describe, it, expect } from "vitest"
import { facetasDePais } from "./facetas-de-pais"

/**
 * A faceta de país deixou de sair de uma lista curada e passa a sair do próprio
 * catálogo: quem tem estudo publicado vira opção, sem cadastro prévio. Era o
 * contrário disso que deixava 23 países publicados e invisíveis no filtro.
 */
describe("facetasDePais", () => {
    it("mostra os países que têm estudo, com a contagem", () => {
        const facetas = facetasDePais({ DE: 6, BR: 1 }, [], "pt")

        expect(facetas).toEqual([
            { code: "DE", nome: "Alemanha", count: 6 },
            { code: "BR", nome: "Brasil", count: 1 },
        ])
    })

    it("aceita país novo sem ninguém ter cadastrado nada", () => {
        // O ponto da mudança: publicar estudo do Vietnã basta.
        const facetas = facetasDePais({ VN: 1 }, [], "pt")

        expect(facetas).toEqual([{ code: "VN", nome: "Vietnã", count: 1 }])
    })

    it("ordena pelo nome traduzido, não pelo código", () => {
        // Em alemão "Spanien" vem antes de "Ungarn"; pelos códigos, ES e HU
        // sairiam na mesma ordem, mas em português "Espanha" vem antes de
        // "Hungria" e em francês "Espagne" antes de "Hongrie" — o teste real é
        // um par que INVERTE conforme o idioma.
        const contagens = { DE: 1, ZA: 1 }

        expect(facetasDePais(contagens, [], "pt").map((f) => f.code)).toEqual(["ZA", "DE"])
        expect(facetasDePais(contagens, [], "de").map((f) => f.code)).toEqual(["DE", "ZA"])
    })

    it("mantém visível a faceta selecionada mesmo sem estudo", () => {
        // Filtro vindo de link antigo: sem isso ele ficaria aplicado sem
        // aparecer em lugar nenhum para ser desmarcado.
        const facetas = facetasDePais({ DE: 6 }, ["FR"], "pt")

        expect(facetas.map((f) => f.code)).toEqual(["DE", "FR"])
        expect(facetas.find((f) => f.code === "FR")?.count).toBe(0)
    })

    it("usa a exceção de rótulo do projeto", () => {
        const facetas = facetasDePais({ NL: 3 }, [], "pt", { NL: "Holanda" })

        expect(facetas[0].nome).toBe("Holanda")
    })

    it("esconde código que não é país", () => {
        // Dado legado: uma faceta "XX" não filtra nada útil e só suja a barra.
        const facetas = facetasDePais({ DE: 1, XX: 2, UK: 1 }, [], "pt")

        expect(facetas.map((f) => f.code)).toEqual(["DE"])
    })

    it("não repete país que também está selecionado", () => {
        const facetas = facetasDePais({ DE: 6 }, ["DE"], "pt")

        expect(facetas).toEqual([{ code: "DE", nome: "Alemanha", count: 6 }])
    })
})
