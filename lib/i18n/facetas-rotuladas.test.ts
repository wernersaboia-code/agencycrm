import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { INDUSTRY_IDS } from "@/lib/constants/catalog-facets"

const pt = JSON.parse(
    readFileSync(join(__dirname, "..", "..", "messages", "pt.json"), "utf8")
) as { catalog: Record<string, Record<string, string>> }

/**
 * `messages-integridade.test.ts` compara cada idioma contra o pt, então uma
 * tradução faltando é reprovada. O que ele NÃO pega é o rótulo faltando no
 * próprio pt — e é assim que um id vaza cru para a tela, que foi o defeito do
 * "food" aparecendo no card em vez de "Alimentos & Bebidas".
 */
describe("todo id de faceta tem rótulo em pt", () => {
    // Só setor é vocabulário curado. País virou dado derivado do catálogo, com
    // o nome vindo do ICU — não há mais lista de rótulos para conferir.
    const grupos: Array<[string, readonly string[]]> = [
        ["industries", INDUSTRY_IDS],
    ]

    for (const [grupo, ids] of grupos) {
        it(`catalog.${grupo} cobre todos os ids`, () => {
            const rotulos = pt.catalog[grupo] ?? {}
            const semRotulo = ids.filter((id) => typeof rotulos[id] !== "string")

            expect(semRotulo).toEqual([])
        })

        it(`catalog.${grupo} não tem rótulo órfão`, () => {
            const rotulos = Object.keys(pt.catalog[grupo] ?? {})
            const orfaos = rotulos.filter((chave) => !(ids as readonly string[]).includes(chave))

            expect(orfaos).toEqual([])
        })
    }
})
