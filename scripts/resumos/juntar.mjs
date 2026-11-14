// scripts/resumos/juntar.mjs — junta um lote de anotações ao arquivo principal.
// As chaves do lote podem ser prefixos do slug, desde que identifiquem um só estudo.
// Uso: node scripts/resumos/juntar.mjs <backup.json> <anotacoes.json> <lote.json>
import { readFileSync, writeFileSync } from "node:fs"
const [, , arqBackup, arqNotas, arqLote] = process.argv
const slugs = JSON.parse(readFileSync(arqBackup, "utf8")).map((i) => i.slug)
const notas = JSON.parse(readFileSync(arqNotas, "utf8"))
const lote = JSON.parse(readFileSync(arqLote, "utf8"))
for (const [chave, nota] of Object.entries(lote)) {
    const exato = slugs.filter((s) => s === chave)
    const achados = exato.length ? exato : slugs.filter((s) => s.startsWith(chave))
    if (achados.length !== 1) throw new Error(`"${chave}" casa com ${achados.length} estudos`)
    notas[achados[0]] = nota
}
writeFileSync(arqNotas, JSON.stringify(notas, null, 2) + "\n", "utf8")
console.log(`${Object.keys(notas).length} estudos anotados`)
