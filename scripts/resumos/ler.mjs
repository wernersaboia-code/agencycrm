// scripts/resumos/ler.mjs — imprime o texto já estruturado, sem sumário nem
// fichas de exemplo, para a leitura de quem marca a ênfase.
// Uso: node scripts/resumos/ler.mjs <formatados.json> <anotacoes.json> <inicio> <quantos>
import { readFileSync } from "node:fs"
const [, , arq, arqNotas, inicio, quantos] = process.argv
const notas = JSON.parse(readFileSync(arqNotas, "utf8"))
const pendentes = JSON.parse(readFileSync(arq, "utf8")).filter((r) => !notas[r.slug])
for (const r of pendentes.slice(+inicio, +inicio + +quantos)) {
    const h = r.html
        .replace(/<h3>(Table of contents|Contents|Chapters)<\/h3>(<p><strong>.*?<\/p>)+/gi, "[SUMARIO]\n")
        .replace(/<p><strong>Sample entry from.*?<\/p>/g, "[FICHA]\n")
        .replace(/<h3>/g, "\n# ").replace(/<li>/g, "  • ").replace(/<p>/g, "¶ ")
        .replace(/<\/(h3|li|p)>/g, "\n").replace(/<br>/g, " / ").replace(/<\/?(ul|strong|em)>/g, "")
        .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    console.log(`\n=== ${r.slug}\n${h.trim()}`)
}
console.error(`${pendentes.length} pendentes`)
