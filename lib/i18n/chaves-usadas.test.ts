import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

/**
 * Toda chave que o código pede com texto literal — `t("vars.SELLER_NAME")` —
 * precisa existir em messages/pt.json.
 *
 * `messages-integridade.test.ts` só compara os idiomas ENTRE SI: se o código
 * chama uma chave que não está em nenhum deles, ele não vê nada. Foi assim que
 * a tela de Configurações passou semanas mostrando
 * "admin.settings.vars.SELLER_NAME" no lugar do texto, com 881 testes verdes.
 *
 * Como funciona: em cada arquivo, acha as variáveis ligadas a um namespace
 * (`const t = useTranslations("admin.lists")`, `getAdminTranslations`,
 * `getTranslations`, inclusive dentro de `const [t, …] = await Promise.all([…])`)
 * e confere cada chamada com string literal. Chave montada em runtime
 * (`t(\`industries.${id}\`)`) não dá para checar estaticamente e fica de fora.
 *
 * Se o mesmo nome de variável aponta para namespaces diferentes no mesmo
 * arquivo (dois componentes, cada um com seu `t`), a chave vale se existir em
 * qualquer um deles — perde um pouco de rigor, mas não acusa falso positivo.
 */

const RAIZ = join(__dirname, "..", "..")
const PASTAS = ["app", "components", "lib", "actions", "contexts", "hooks"]
const IGNORAR = new Set(["node_modules", ".next", ".claude"])

const pt = JSON.parse(readFileSync(join(RAIZ, "messages", "pt.json"), "utf8")) as Record<string, unknown>

function existe(caminho: string): boolean {
    let atual: unknown = pt
    for (const parte of caminho.split(".")) {
        if (typeof atual !== "object" || atual === null || !(parte in atual)) return false
        atual = (atual as Record<string, unknown>)[parte]
    }
    return true
}

function arquivos(pasta: string): string[] {
    const saida: string[] = []
    for (const nome of readdirSync(pasta)) {
        if (IGNORAR.has(nome)) continue
        const caminho = join(pasta, nome)
        if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho))
        else if (/\.tsx?$/.test(nome) && !/\.test\.tsx?$/.test(nome)) saida.push(caminho)
    }
    return saida
}

const CHAMADA_DE_NAMESPACE = /(?:useTranslations|getAdminTranslations|getTranslations)\(\s*(?:\{[^}]*namespace:\s*)?["']([\w.]+)["']/

/** variável → namespaces a que ela está ligada neste arquivo. */
function ligacoes(codigo: string): Map<string, Set<string>> {
    const mapa = new Map<string, Set<string>>()
    const ligar = (variavel: string, namespace: string) => {
        if (!mapa.has(variavel)) mapa.set(variavel, new Set())
        mapa.get(variavel)!.add(namespace)
    }

    const direta = new RegExp(`const\\s+(\\w+)\\s*=\\s*(?:await\\s+)?${CHAMADA_DE_NAMESPACE.source}`, "g")
    for (const [, variavel, namespace] of codigo.matchAll(direta)) ligar(variavel, namespace)

    // const [t, setores, locale] = await Promise.all([getAdminTranslations("x"), getSetores(), …])
    const emLote = /const\s+\[([^\]]+)\]\s*=\s*await\s+Promise\.all\(\[([\s\S]*?)\]\s*\)/g
    for (const [, nomes, elementos] of codigo.matchAll(emLote)) {
        const variaveis = nomes.split(",").map((nome) => nome.trim())
        // Separa os elementos no nível de topo (vírgulas fora de parênteses).
        const partes: string[] = []
        let profundidade = 0
        let atual = ""
        for (const caractere of elementos) {
            if ("([{".includes(caractere)) profundidade++
            if (")]}".includes(caractere)) profundidade--
            if (caractere === "," && profundidade === 0) {
                partes.push(atual)
                atual = ""
            } else {
                atual += caractere
            }
        }
        partes.push(atual)
        partes.forEach((parte, indice) => {
            const achado = parte.match(CHAMADA_DE_NAMESPACE)
            if (achado && variaveis[indice]) ligar(variaveis[indice], achado[1])
        })
    }
    return mapa
}

function chavesFaltando(): string[] {
    const faltando: string[] = []
    for (const pasta of PASTAS) {
        for (const arquivo of arquivos(join(RAIZ, pasta))) {
            const codigo = readFileSync(arquivo, "utf8")
            for (const [variavel, namespaces] of ligacoes(codigo)) {
                const chamada = new RegExp(`(?<![\\w.])${variavel}(?:\\.rich|\\.markup)?\\(\\s*["']([\\w.]+)["']`, "g")
                for (const [, chave] of codigo.matchAll(chamada)) {
                    const ok = [...namespaces].some((namespace) => existe(`${namespace}.${chave}`))
                    if (!ok) {
                        faltando.push(`${relative(RAIZ, arquivo)}: ${[...namespaces].join("|")}.${chave}`)
                    }
                }
            }
        }
    }
    return [...new Set(faltando)].sort()
}

describe("chaves de tradução usadas no código", () => {
    it("toda chave literal existe em messages/pt.json", () => {
        expect(chavesFaltando()).toEqual([])
    })
})
