// scripts/resumos/gravar.mjs
//
// Grava no banco os resumos formatados por scripts/resumos/formatar.mjs.
//
// Uso: node scripts/resumos/gravar.mjs <backup.json> <formatados.json> [formatados-anteriores.json]
//
// Trava de segurança: só troca o resumo que ainda está IGUAL ao do backup. Se
// alguém editou o estudo no admin depois da exportação, ele é pulado e listado.

import "dotenv/config"
import { readFileSync } from "node:fs"
import pg from "pg"

const [, , arqBackup, arqFormatados, arqAnterior] = process.argv
const backup = new Map(JSON.parse(readFileSync(arqBackup, "utf8")).map((i) => [i.id, i]))
const formatados = JSON.parse(readFileSync(arqFormatados, "utf8"))

// Versão formatada gravada antes (amostra): também pode ser substituída.
const anterior = new Map(arqAnterior ? JSON.parse(readFileSync(arqAnterior, "utf8")).map((i) => [i.id, i.html]) : [])

const comAviso = formatados.filter((f) => f.avisos?.length)
if (comAviso.length) {
    console.error(`Há ${comAviso.length} resumos com aviso; nada foi gravado.`)
    process.exit(1)
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
let gravados = 0
const pulados = []

for (const item of formatados) {
    const original = backup.get(item.id)
    if (!original) { pulados.push(`${item.slug} (fora do backup)`); continue }

    const { rowCount } = await pool.query(
        `update lead_lists
            set introduction = $1, "updatedAt" = now()
          where id = $2 and (introduction = $3 or introduction = $4) and introduction <> $1`,
        [item.html, item.id, original.introduction, anterior.get(item.id) ?? original.introduction],
    )
    if (rowCount === 1) gravados++
    else pulados.push(`${item.slug} (já está assim, ou mudou no banco desde o backup)`)
}

console.log(`${gravados} gravados, ${pulados.length} pulados`)
for (const p of pulados) console.log(`  - ${p}`)

await pool.end()
