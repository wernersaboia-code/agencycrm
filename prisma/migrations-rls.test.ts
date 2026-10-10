// prisma/migrations-rls.test.ts
//
// Toda tabela criada em `public` precisa de RLS ligada em alguma migration.
//
// A chave anônima do Supabase vai no bundle do navegador e as roles `anon` e
// `authenticated` têm todos os privilégios nas tabelas de `public`. Tabela sem
// RLS fica aberta a qualquer um pela API REST do Supabase. Três tabelas nasceram
// assim depois de 20260804160000_enable_rls_all_tables e só o advisor do
// Supabase percebeu, semanas depois (ver 20261009200000).
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const PASTA = join(__dirname, "migrations")

function sqlDeTodasAsMigrations(): string {
    return readdirSync(PASTA, { withFileTypes: true })
        .filter((entrada) => entrada.isDirectory())
        .map((entrada) => entrada.name)
        .sort()
        .map((nome) => readFileSync(join(PASTA, nome, "migration.sql"), "utf8"))
        .join("\n")
}

function nomeDaTabela(bruto: string): string {
    return bruto.replace(/^"?public"?\./i, "").replace(/"/g, "")
}

describe("migrations", () => {
    it("ligam RLS em toda tabela que criam", () => {
        const sql = sqlDeTodasAsMigrations()

        const criadas = new Set(
            [...sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?((?:"?public"?\.)?"?\w+"?)/gi)].map(
                (m) => nomeDaTabela(m[1])
            )
        )
        const comRls = new Set(
            [...sql.matchAll(/ALTER TABLE\s+(?:ONLY\s+)?((?:"?public"?\.)?"?\w+"?)\s+ENABLE ROW LEVEL SECURITY/gi)].map(
                (m) => nomeDaTabela(m[1])
            )
        )
        const removidas = new Set(
            [...sql.matchAll(/DROP TABLE\s+(?:IF EXISTS\s+)?((?:"?public"?\.)?"?\w+"?)/gi)].map((m) =>
                nomeDaTabela(m[1])
            )
        )

        const semRls = [...criadas].filter((t) => !comRls.has(t) && !removidas.has(t)).sort()

        expect(semRls).toEqual([])
    })
})
