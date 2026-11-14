// scripts/resumos/gravar-descricoes.mjs
//
// Grava descrições de estudos (texto puro, 1–2 frases) a partir de um JSON
// { slug: descrição }. Só troca a descrição que ainda está IGUAL à do backup.
//
// Uso: node scripts/resumos/gravar-descricoes.mjs <backup.json> <propostas.json> [--gravar]

import "dotenv/config"
import { readFileSync } from "node:fs"
import pg from "pg"

const [, , arqBackup, arqPropostas, modo] = process.argv
const backup = new Map(JSON.parse(readFileSync(arqBackup, "utf8")).map((i) => [i.slug, i]))
const propostas = Object.entries(JSON.parse(readFileSync(arqPropostas, "utf8")))

// Mesma faixa das descrições de 10/10/2026: cabe no cartão e no Google.
const problemas = []
for (const [slug, texto] of propostas) {
    if (!backup.has(slug)) problemas.push(`${slug}: não existe`)
    if (texto.length < 165 || texto.length > 222) problemas.push(`${slug}: ${texto.length} caracteres`)
    if (/\d/.test(texto)) problemas.push(`${slug}: tem número`)
    if (!/\.$/.test(texto)) problemas.push(`${slug}: não termina em ponto`)
}
if (problemas.length) {
    console.error(problemas.join("\n"))
    process.exit(1)
}
console.log(`${propostas.length} descrições válidas`)
if (modo !== "--gravar") process.exit(0)

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
let gravadas = 0
for (const [slug, texto] of propostas) {
    const { rowCount } = await pool.query(
        `update lead_lists set description = $1, "updatedAt" = now()
          where slug = $2 and description is not distinct from $3`,
        [texto, slug, backup.get(slug).description],
    )
    if (rowCount === 1) gravadas++
    else console.log(`  - pulada: ${slug}`)
}
console.log(`${gravadas} gravadas`)
await pool.end()
