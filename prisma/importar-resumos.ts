/**
 * Preenche a introdução das listas com o RESUMO EXECUTIVO do próprio estudo em
 * PDF. Roda com `npm run meta:resumos` (simulação) ou
 * `npm run meta:resumos -- --aplicar` (grava).
 *
 * Por que existe: a introdução da página da lista É o resumo do estudo, e copiar
 * isso à mão estudo por estudo é justamente o que enchia o campo com as quebras
 * de linha do PDF. A leitura do PDF (lib/marketplace/pdf-do-estudo.ts) devolve o
 * texto já em parágrafos.
 *
 * Política de escrita, de propósito conservadora:
 *
 * - SEM `--aplicar` nada é gravado; o script só relata o que faria.
 * - Com `--aplicar`, o padrão é preencher SÓ a introdução vazia. Trocar texto
 *   que uma pessoa escreveu exige `--sobrescrever` explícito.
 * - Estudo cujo resumo não pôde ser lido (PDF sem primeira seção identificável,
 *   arquivo ilegível) é relatado e a introdução fica como está: um recorte
 *   errado no ar é pior que um campo vazio.
 *
 * `--json <arquivo>` grava as propostas para revisão antes de aplicar.
 * `--slugs <arquivo>` limita a operação às listas listadas no arquivo (um slug
 * por linha) — para aplicar só a um grupo, sem tocar no resto do catálogo.
 *
 * Idempotente: introdução que já é exatamente o resumo extraído não é reescrita,
 * então rodar de novo não muda nada.
 */
import { readFileSync, writeFileSync } from "node:fs"
import { PrismaClient } from "@prisma/client"
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { extrairResumoDoPdf } from "../lib/marketplace/pdf-do-estudo"

config({ path: [".env.local", ".env"] })

const prisma = new PrismaClient()
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
)

const BUCKET = "list-studies"

interface Proposta {
    slug: string
    language: string | null
    resumo: string
}

function caminhoNoBucket(url: string): string {
    const marca = `/${BUCKET}/`
    const indice = url.indexOf(marca)
    return indice === -1 ? url : url.slice(indice + marca.length).split("?")[0]
}

function argumento(nome: string): string | null {
    const prefixo = `--${nome}=`
    const comIgual = process.argv.find((a) => a.startsWith(prefixo))
    if (comIgual) return comIgual.slice(prefixo.length)

    const indice = process.argv.indexOf(`--${nome}`)
    return indice === -1 ? null : (process.argv[indice + 1] ?? null)
}

async function main() {
    const aplicar = process.argv.includes("--aplicar")
    const sobrescrever = process.argv.includes("--sobrescrever")
    const arquivoJson = argumento("json")
    const arquivoDeSlugs = argumento("slugs")

    const permitidos = arquivoDeSlugs
        ? new Set(
              readFileSync(arquivoDeSlugs, "utf8")
                  .split(/\r?\n/)
                  .map((linha) => linha.trim())
                  .filter(Boolean)
          )
        : null

    const listas = (
        await prisma.leadList.findMany({
            where: { studyPdfUrl: { not: null } },
            select: { id: true, slug: true, language: true, studyPdfUrl: true, introduction: true },
            orderBy: { slug: "asc" },
        })
    ).filter((lista) => !permitidos || permitidos.has(lista.slug))

    console.log(
        `${listas.length} estudo(s) com PDF` +
            (permitidos ? ` (de ${permitidos.size} slug(s) pedidos)` : "") +
            "." +
            (aplicar
                ? ` Modo gravação${sobrescrever ? " COM sobrescrita" : " (só introdução vazia)"}.`
                : " Simulação: nada será gravado.")
    )

    const propostas: Proposta[] = []
    const ilegiveis: string[] = []
    let preenchidas = 0
    let sobrescritas = 0
    let iguais = 0
    let preservadas = 0

    for (const [indice, lista] of listas.entries()) {
        const posicao = `[${String(indice + 1).padStart(3)}/${listas.length}]`
        const atual = lista.introduction?.trim() ?? ""

        let resumo: string | null = null
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET)
                .download(caminhoNoBucket(lista.studyPdfUrl as string))
            if (error || !data) throw new Error(error?.message ?? "arquivo indisponível")

            resumo = await extrairResumoDoPdf(new Uint8Array(await data.arrayBuffer()))
        } catch (erro) {
            console.log(`${posicao} ${lista.slug} — FALHA ao ler o PDF: ${(erro as Error).message}`)
            ilegiveis.push(lista.slug)
            continue
        }

        if (!resumo) {
            console.log(`${posicao} ${lista.slug} — resumo não identificado no PDF`)
            ilegiveis.push(lista.slug)
            continue
        }

        propostas.push({ slug: lista.slug, language: lista.language, resumo })

        if (resumo === atual) {
            iguais++
            console.log(`${posicao} ${lista.slug} — já é o resumo do estudo (${resumo.length} chars)`)
            continue
        }

        const acao = !atual ? "PREENCHER" : sobrescrever ? "SOBRESCREVER" : "preservar"
        console.log(
            `${posicao} ${lista.slug} — resumo ${resumo.length} chars / ${resumo.split("\n\n").length} parágrafos; ` +
                `introdução atual ${atual.length} chars -> ${acao}`
        )

        if (!atual) preenchidas++
        else if (sobrescrever) sobrescritas++
        else preservadas++

        const deveGravar = aplicar && (!atual || sobrescrever)
        if (!deveGravar) continue

        await prisma.leadList.update({
            where: { id: lista.id },
            data: { introduction: resumo },
        })
    }

    if (arquivoJson) {
        writeFileSync(arquivoJson, JSON.stringify(propostas, null, 2), "utf8")
        console.log(`\nPropostas gravadas em ${arquivoJson}`)
    }

    console.log(
        `\nresumos lidos: ${propostas.length} | não identificados: ${ilegiveis.length}` +
            (ilegiveis.length > 0 ? ` (${ilegiveis.join(", ")})` : "")
    )
    console.log(
        `introdução vazia a preencher: ${preenchidas} | a sobrescrever: ${sobrescritas} | ` +
            `preservadas: ${preservadas} | já iguais ao resumo: ${iguais}`
    )

    if (!aplicar) {
        console.log("Simulação: nada foi gravado. Use -- --aplicar (e -- --sobrescrever) para gravar.")
    } else {
        console.log(`Banco atualizado: ${preenchidas + sobrescritas} introdução(ões).`)
    }

    await prisma.$disconnect()
}

main().catch(async (erro) => {
    console.error(erro)
    await prisma.$disconnect()
    process.exit(1)
})
