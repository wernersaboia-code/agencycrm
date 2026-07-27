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
/**
 * Namespaces que ainda não foram traduzidos em todos os locales publicados.
 * O fallback em i18n/request.ts faz essas chaves aparecerem em português em vez
 * de virarem caminho cru, então a lacuna não quebra tela nenhuma — mas fica
 * registrada aqui para não sumir de vista. Tirar da lista quando traduzir.
 */
const LACUNAS_CONHECIDAS: Record<string, string[]> = {
    de: ["admin"],
    es: ["admin"],
    fr: ["admin"],
    it: ["admin"],
    nl: ["admin"],
}

function chaves(objeto: unknown, prefixo = ""): string[] {
    if (typeof objeto !== "object" || objeto === null) return [prefixo]

    return Object.entries(objeto).flatMap(([chave, valor]) =>
        chaves(valor, prefixo ? `${prefixo}.${chave}` : chave)
    )
}

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

        if (locale !== "pt") {
            it(`${locale} tem todas as chaves de pt fora das lacunas conhecidas`, () => {
                const doLocale = new Set(chaves(JSON.parse(raw(locale))))
                const ignorados = LACUNAS_CONHECIDAS[locale] ?? []

                const faltando = chaves(JSON.parse(raw("pt")))
                    .filter((chave) => !doLocale.has(chave))
                    .filter((chave) => !ignorados.includes(chave.split(".")[0]))

                expect(faltando).toEqual([])
            })
        }
    }
})
