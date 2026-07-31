import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const SUPER_ADMIN = join(__dirname, "..", "..", "app", "(app)", "super-admin")

function arquivosTsx(dir: string): string[] {
    return readdirSync(dir).flatMap((nome) => {
        const caminho = join(dir, nome)
        if (statSync(caminho).isDirectory()) return arquivosTsx(caminho)
        return nome.endsWith(".tsx") ? [caminho] : []
    })
}

function relativo(caminho: string): string {
    return caminho.slice(caminho.indexOf("super-admin")).replace(/\\/g, "/")
}

/**
 * O super-admic fala o idioma da CONTA (getAdminLocale), não o do cookie do
 * site. Duas regressões cabem aqui e nenhuma quebra o build:
 *
 * 1. Uma página server chamar `getTranslations` do next-intl direto. Sem locale
 *    explícito, ela cai no i18n/request.ts, que nas rotas sem segmento de
 *    idioma lê o cookie `NEXT_LOCALE` — e a página passa a falar um idioma
 *    diferente da sidebar e do header, que leem o provider do layout. Já
 *    aconteceu em produção: conteúdo em alemão com menu em português.
 * 2. Texto cravado no componente. Foi assim que empresas/contas, configurações
 *    e blog continuaram em português mesmo depois do namespace `admin` inteiro
 *    ser traduzido — as chaves existiam e ninguém as consumia.
 */
describe("idioma do super-admin", () => {
    const arquivos = arquivosTsx(SUPER_ADMIN)

    it("encontra as páginas do super-admin", () => {
        expect(arquivos.length).toBeGreaterThan(10)
    })

    it("nenhuma página importa getTranslations do next-intl direto", () => {
        const infratores = arquivos
            .filter((caminho) => /from "next-intl\/server"/.test(readFileSync(caminho, "utf8")))
            .map(relativo)

        expect(infratores).toEqual([])
    })

    it("nenhuma página crava data em pt-BR", () => {
        const infratores = arquivos
            .filter((caminho) => /ptBR|"pt-BR"/.test(readFileSync(caminho, "utf8")))
            .map(relativo)

        expect(infratores).toEqual([])
    })

    it("nenhuma página tem texto de interface cravado em português", () => {
        // Heurística deliberadamente estreita: só pega palavra portuguesa dentro
        // de string literal ou entre tags. Nome de variável e comentário passam.
        const suspeito = /(?:"[^"]*|>[^<>{}]*)(?:ção|ções|Voltar|Buscar|Salvar|Excluir|Nenhum[ao]?|Página|Anterior|Próxima|Usuários|Configurações)(?:[^"]*"|[^<>{}]*<)/

        const infratores = arquivos
            .flatMap((caminho) => {
                const linhas = readFileSync(caminho, "utf8").split("\n")
                return linhas
                    .map((linha, i) => ({ linha: linha.trim(), n: i + 1, caminho }))
                    .filter(({ linha }) => suspeito.test(linha))
                    .filter(({ linha }) => !/^(import|\/\/|\*)/.test(linha))
                    .filter(({ linha }) => !/className|href=/.test(linha))
            })
            .map(({ caminho, n, linha }) => `${relativo(caminho)}:${n} ${linha}`)

        expect(infratores).toEqual([])
    })
})
