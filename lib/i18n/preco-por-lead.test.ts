import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PUBLISHED_LOCALES } from "./locales"

const MESSAGES_DIR = join(__dirname, "..", "..", "messages")

function mensagens(locale: string): Record<string, never> {
    return JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), "utf8"))
}

function valor(objeto: unknown, caminho: string): string {
    return caminho.split(".").reduce<never>((o, k) => (o as never)[k], objeto as never)
}

/**
 * O produto deixou de vender lead avulso e passou a vender estudo de entrada
 * de mercado, então nenhum texto que o cliente lê pode cobrar "preço por lead".
 *
 * Este teste existe porque a correção já se perdeu uma vez: ela estava sem
 * commit quando um `git checkout -- messages/` desfez outra coisa no mesmo
 * diretório, e a regressão foi para produção dentro de um commit que dizia
 * tê-la feito. Nada no build acusa isso.
 *
 * As chaves aqui são só as RENDERIZADAS. `catalog.perLead`, `listing.perLead` e
 * `listing.fieldPricePerLead` continuam com o termo e não estão na lista porque
 * nenhum componente as usa — se voltarem a ser usadas, entram aqui.
 */
const CHAVES_VISIVEIS = [
    "listing.beforeBuyNote",
    "landing.howItWorks.steps.1.body",
]

const POR_LEAD = /por lead|per lead|pro Lead|par lead|per Lead/i

describe("preço por lead não aparece em texto visível", () => {
    for (const locale of PUBLISHED_LOCALES) {
        const m = mensagens(locale)

        for (const chave of CHAVES_VISIVEIS) {
            it(`${locale}: ${chave}`, () => {
                expect(valor(m, chave)).not.toMatch(POR_LEAD)
            })
        }
    }
})
