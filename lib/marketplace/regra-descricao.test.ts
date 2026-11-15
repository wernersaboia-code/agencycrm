import { describe, expect, it } from "vitest"
import { conferirDescricao } from "./regra-descricao"

// Descrições reais do catálogo (gravadas em 14.11.2026).
const BOA =
    "Europe's largest home-improvement and garden market. Covers market size, who decides on listings, access for branded and private-label suppliers and a directory of German importers and buying offices."

describe("conferirDescricao", () => {
    it("aceita uma descrição dentro da regra", () => {
        expect(conferirDescricao(BOA)).toEqual([])
    })

    it("acusa vazia sem acusar o resto", () => {
        expect(conferirDescricao("")).toEqual(["vazia"])
        expect(conferirDescricao("   ")).toEqual(["vazia"])
        expect(conferirDescricao(null)).toEqual(["vazia"])
    })

    it("acusa o texto de capa do PDF", () => {
        const capa =
            "Baby, Toddler and Children's Products in Canada Market volume, major players, opportunities and directory of importers Product scope: all product groups presented at Kind+Jugend (Cologne) Edition: October 2026"
        expect(conferirDescricao(capa)).toEqual(expect.arrayContaining(["capa", "numero", "semPonto"]))
    })

    it("não confunde 'edition' na prosa com a capa", () => {
        const prosa = BOA.replace("Covers", "This edition covers")
        expect(conferirDescricao(prosa)).not.toContain("capa")
    })

    it("acusa curta, longa e número", () => {
        expect(conferirDescricao("A small market.")).toEqual(["curta"])
        expect(conferirDescricao(`${BOA} ${BOA}`)).toEqual(["longa"])
        expect(conferirDescricao(BOA.replace("Europe's largest", "A EUR 9.3 billion"))).toEqual(["numero"])
    })
})
