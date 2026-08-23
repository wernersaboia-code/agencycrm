import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PUBLISHED_LOCALES } from "./locales"

const MESSAGES_DIR = join(__dirname, "..", "..", "messages")

function mensagens(locale: string): Record<string, never> {
    return JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), "utf8"))
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
 * A varredura é do arquivo INTEIRO, não de uma lista de chaves. A versão antiga
 * listava só as chaves renderizadas e deixava `catalog.perLead`,
 * `listing.perLead` e `listing.fieldPricePerLead` de fora por não terem
 * componente — o que na prática guardava o texto proibido no repositório,
 * pronto para voltar à tela no dia em que alguém plugasse a chave. Essas chaves
 * foram removidas e a varredura passou a ser total: o termo não pode existir
 * nem adormecido.
 */
const POR_LEAD = /por lead|per lead|pro Lead|par lead|per Lead|pro lead/i

function textos(objeto: unknown, prefixo = ""): [string, string][] {
    if (typeof objeto === "string") return [[prefixo, objeto]]
    if (typeof objeto !== "object" || objeto === null) return []

    return Object.entries(objeto).flatMap(([chave, valor]) =>
        textos(valor, prefixo ? `${prefixo}.${chave}` : chave)
    )
}

describe("preço por lead não aparece em nenhum texto", () => {
    for (const locale of PUBLISHED_LOCALES) {
        it(`${locale} não tem "por lead" em chave nenhuma`, () => {
            const infratores = textos(mensagens(locale))
                .filter(([, texto]) => POR_LEAD.test(texto))
                .map(([chave, texto]) => `${chave}: ${texto}`)

            expect(infratores).toEqual([])
        })
    }
})
