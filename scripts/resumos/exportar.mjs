// scripts/resumos/exportar.mjs
//
// Exporta as introduções (resumos) dos estudos para um JSON local. Só LEITURA.
// Uso: node scripts/resumos/exportar.mjs <arquivo-de-saida.json>

import "dotenv/config"
import { writeFileSync } from "node:fs"
import pg from "pg"

const saida = process.argv[2]
if (!saida) {
    console.error("Informe o arquivo de saída.")
    process.exit(1)
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

const { rows } = await pool.query(
    `select id, slug, name, language, "isActive", introduction
       from lead_lists
      where introduction is not null
      order by slug`,
)

writeFileSync(saida, JSON.stringify(rows, null, 2), "utf8")
console.log(`${rows.length} resumos em ${saida}`)

await pool.end()
