/**
 * Conserta os textos de lista gravados com as quebras de linha VISUAIS do PDF de
 * origem — a introdução e a descrição. Roda com `npm run meta:textos` (simulação)
 * ou `npm run meta:textos -- --aplicar` (grava).
 *
 * Por que existe: introdução e descrição são texto puro colado de um estudo em
 * PDF. Até lib/marketplace/texto-colado.ts entrar, cada linha visual do
 * documento era gravada como uma quebra de linha de verdade, e a página da lista
 * — que monta parágrafos — exibia a introdução cortada no meio das frases, com
 * compostos partidos ("EU-" / "based") e sem parágrafo nenhum. A limpeza já roda
 * na colagem, na gravação e na renderização; este script só alinha o que ficou
 * gravado antes disso, para o texto no banco ser o mesmo que a página mostra.
 *
 * A simulação é o PADRÃO: sem `--aplicar` nada é escrito. Antes de cada escrita
 * o script confere que a limpeza não mexeu em conteúdo — tirando os espaços, o
 * texto limpo tem exatamente os mesmos caracteres do original. Só quebra de
 * linha e espaço são movidos; nenhuma palavra entra ou sai.
 *
 * Idempotente: texto já limpo não é tocado, então rodar de novo não muda nada.
 */
import { PrismaClient } from "@prisma/client"
import { config } from "dotenv"
import { normalizarTextoColado } from "../lib/marketplace/texto-colado"

config({ path: [".env.local", ".env"] })

const prisma = new PrismaClient()

/** Só para comparar conteúdo: espaços e invisíveis fora, acento recomposto. */
function semEspacos(texto: string): string {
    return texto
        .normalize("NFC")
        .replace(/[\u00ad\u200b-\u200d\ufeff]/g, "")
        .replace(/\s+/g, "")
}

/** Sumário de PDF ("1. Executive Summary.......3") não é introdução. */
const EH_SUMARIO = /\.{4,}/

const CAMPOS = ["introduction", "description"] as const

type Campo = (typeof CAMPOS)[number]

interface Lista {
    id: string
    slug: string
    introduction: string | null
    description: string | null
}

async function main() {
    const aplicar = process.argv.includes("--aplicar")

    const listas: Lista[] = await prisma.leadList.findMany({
        select: { id: true, slug: true, introduction: true, description: true },
        orderBy: { slug: "asc" },
    })

    let camposALimpar = 0
    let listasTocadas = 0
    let gravadas = 0

    for (const lista of listas) {
        const mudancas: { campo: Campo; antes: string; depois: string }[] = []

        for (const campo of CAMPOS) {
            const antes = lista[campo] ?? ""
            if (!antes.trim()) continue

            const depois = normalizarTextoColado(antes)
            if (depois === antes) continue

            if (semEspacos(antes) !== semEspacos(depois)) {
                throw new Error(
                    `A limpeza mudaria conteúdo em ${lista.slug}.${campo}: abortando sem gravar nada.`
                )
            }

            mudancas.push({ campo, antes, depois })
        }

        if (mudancas.length === 0) continue

        listasTocadas++
        camposALimpar += mudancas.length

        const detalhe = mudancas
            .map(
                ({ campo, antes, depois }) =>
                    `${campo}: ${antes.length} -> ${depois.length} chars, ` +
                    `${antes.split("\n").length} linha(s) -> ${depois.split("\n\n").length} parágrafo(s)`
            )
            .join(" | ")

        const aviso =
            lista.introduction && EH_SUMARIO.test(lista.introduction)
                ? "  <-- ATENÇÃO: introdução é colagem de SUMÁRIO, precisa de texto de verdade"
                : ""

        console.log(`${aplicar ? "[aplicar] " : "[dry-run] "}${lista.slug} — ${detalhe}${aviso}`)

        if (!aplicar) continue

        await prisma.leadList.update({
            where: { id: lista.id },
            data: Object.fromEntries(mudancas.map(({ campo, depois }) => [campo, depois])),
        })
        gravadas++
    }

    console.log(
        `\n${listas.length} lista(s) lida(s); ${listasTocadas} com texto colado de PDF ` +
            `(${camposALimpar} campo(s)).`
    )

    if (aplicar) {
        console.log(`${gravadas} lista(s) atualizada(s) no banco.`)
    } else {
        console.log("Simulação: nada foi gravado. Use -- --aplicar para gravar.")
    }

    await prisma.$disconnect()
}

main().catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
})
