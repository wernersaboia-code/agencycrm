import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PUBLISHED_LOCALES } from "./locales"

const MESSAGES_DIR = join(__dirname, "..", "..", "messages")

function raw(locale: string): string {
    return readFileSync(join(MESSAGES_DIR, `${locale}.json`), "utf8")
}

/**
 * Duas regressões já chegaram ao ar por estes arquivos e nenhuma quebra o build:
 *
 * 1. Namespace de topo duplicado. `JSON.parse` fica com a ÚLTIMA ocorrência, então
 *    um bloco novo colado no fim do arquivo apaga silenciosamente o bloco bom —
 *    foi assim que pt e de perderam as chaves do funil e passaram a renderizar
 *    "cart.openCart" na tela.
 * 2. Texto duplamente codificado (UTF-8 lido como cp1252 e salvo de novo), que
 *    transforma "dónde" em "dÃ³nde" e "—" em "â€”".
 */
describe("integridade dos arquivos de mensagens", () => {
    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale} não tem namespace de topo duplicado`, () => {
            const topLevelKeys = Array.from(raw(locale).matchAll(/^ {4}"([^"]+)":/gm)).map(
                (match) => match[1]
            )
            const duplicated = topLevelKeys.filter(
                (key, index) => topLevelKeys.indexOf(key) !== index
            )

            expect(duplicated).toEqual([])
        })

        it(`${locale} não tem texto duplamente codificado`, () => {
            const suspicious = raw(locale)
                .split("\n")
                .filter((line) => /Ã.|â€|Â[\s·©]/.test(line))
                .map((line) => line.trim())

            expect(suspicious).toEqual([])
        })
    }
})
