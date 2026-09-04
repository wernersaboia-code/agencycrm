import { describe, it, expect } from "vitest"

import { PAISES_DO_MAPA } from "@/components/landing/dados-mapa-mundi"
import { CONTINENTES, continenteDoPais, paisesDoContinente } from "./continentes"

describe("continenteDoPais", () => {
    /**
     * O teste que justifica a tabela existir à mão.
     *
     * O mapa gerado e a tabela de continentes vêm de fontes diferentes
     * (world-atlas de um lado, UN M49 do outro) e nada além deste teste as
     * mantém em dia. Um país presente no mapa e ausente da tabela sumiria da
     * contagem por continente sem erro nenhum — o defeito silencioso que a
     * lista curada de regiões tinha, e que motivou trocá-la.
     */
    it("conhece TODOS os paises do mapa gerado", () => {
        const semContinente = PAISES_DO_MAPA.map((p) => p.code).filter(
            (code) => continenteDoPais(code) === null
        )

        expect(semContinente).toEqual([])
    })

    it("normaliza o codigo antes de procurar", () => {
        expect(continenteDoPais("de")).toBe("europa")
        expect(continenteDoPais(" BR ")).toBe("americaDoSul")
    })

    it("devolve null para codigo desconhecido em vez de chutar", () => {
        expect(continenteDoPais("XX")).toBeNull()
        expect(continenteDoPais("")).toBeNull()
    })

    it("nao repete um pais em dois continentes", () => {
        const vistos = new Map<string, string>()
        const repetidos: string[] = []

        for (const continente of CONTINENTES) {
            for (const code of paisesDoContinente(continente)) {
                if (vistos.has(code)) repetidos.push(`${code}: ${vistos.get(code)} e ${continente}`)
                vistos.set(code, continente)
            }
        }

        expect(repetidos).toEqual([])
    })

    /**
     * Casos transcontinentais, fixados porque são exatamente os que alguém
     * "corrigiria" sem saber que a escolha é deliberada (ver o comentário do
     * módulo).
     */
    it("segue a UN M49 nos paises transcontinentais", () => {
        expect(continenteDoPais("TR")).toBe("asia")
        expect(continenteDoPais("CY")).toBe("asia")
        expect(continenteDoPais("GE")).toBe("asia")
        expect(continenteDoPais("RU")).toBe("europa")
    })

    it("poe America Central e Caribe na America do Norte", () => {
        expect(continenteDoPais("MX")).toBe("americaDoNorte")
        expect(continenteDoPais("CR")).toBe("americaDoNorte")
        expect(continenteDoPais("CU")).toBe("americaDoNorte")
    })
})
