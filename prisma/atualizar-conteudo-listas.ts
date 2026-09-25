/**
 * Reescreve metaTitle/metaDescription/introduction das listas ativas no IDIOMA
 * DO ESTUDO (`LeadList.language`), não no idioma do país. Roda com
 * `npm run meta:listas` (aceita `--dry-run`).
 *
 * Por que existe: as introduções e a metadata de busca destes estudos foram
 * escritas no idioma do país-alvo (alemão para a Alemanha, francês para a
 * França, e assim por diante), enquanto o PDF do estudo é em inglês — o idioma
 * registrado em `LeadList.language`. O leitor via um resumo em alemão e baixava
 * um estudo em inglês. A regra agora é uma só: o texto que descreve o estudo
 * acompanha o idioma do estudo.
 *
 * URL de origem do conteúdo: `prisma/dados/conteudo-listas.json`, um array de
 * `{ slug, language, metaTitle, metaDescription, introduction }`. Manter o texto
 * fora do código deixa a revisão do conteúdo legível num diff.
 *
 * O conteúdo das listas cujo estudo NÃO é em inglês (hoje uma em `pt` e uma em
 * `es`) permanece no idioma do estudo; o arquivo já traz esses casos resolvidos.
 *
 * Regra de veracidade: as introduções descrevem a ESTRUTURA do mercado (canais,
 * concentração, barreiras) e o que o estudo cobre. Nenhuma cifra foi inventada;
 * os números são os mesmos dos textos anteriores, preservados na tradução.
 *
 * Idempotente: escreve sempre os valores do arquivo, então rodar de novo aplica
 * revisões. Não toca em lista fora do arquivo.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PrismaClient } from "@prisma/client"
import { config } from "dotenv"
import { descricaoCabeNaSerp, tituloCabeNaSerp } from "../lib/seo/meta-length"

config({ path: [".env.local", ".env"] })

const prisma = new PrismaClient()

interface ConteudoLista {
    slug: string
    language: string
    metaTitle: string
    metaDescription: string
    introduction: string
}

const ARQUIVO = join(process.cwd(), "prisma", "dados", "conteudo-listas.json")

const CONTEUDO = JSON.parse(readFileSync(ARQUIVO, "utf8")) as ConteudoLista[]

async function main() {
    const dryRun = process.argv.includes("--dry-run")

    if (!Array.isArray(CONTEUDO) || CONTEUDO.length === 0) {
        throw new Error(`Arquivo de conteúdo vazio ou inválido: ${ARQUIVO}`)
    }

    for (const item of CONTEUDO) {
        if (!tituloCabeNaSerp(item.metaTitle)) {
            throw new Error(
                `metaTitle fora do limite de SERP (${item.metaTitle.length}): ${item.slug}`
            )
        }
        if (!descricaoCabeNaSerp(item.metaDescription)) {
            throw new Error(
                `metaDescription fora do limite de SERP (${item.metaDescription.length}): ${item.slug}`
            )
        }
    }

    const slugs = CONTEUDO.map((item) => item.slug)
    const duplicados = slugs.filter((slug, i) => slugs.indexOf(slug) !== i)
    if (duplicados.length > 0) {
        throw new Error(`Slugs duplicados no arquivo: ${[...new Set(duplicados)].join(", ")}`)
    }

    const existentes = await prisma.leadList.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true, language: true },
    })
    const existentesMap = new Map(existentes.map((l) => [l.slug, l]))

    const ausentes = slugs.filter((slug) => !existentesMap.has(slug))
    if (ausentes.length > 0) {
        throw new Error(`Listas não encontradas: ${ausentes.join(", ")}`)
    }

    // O conteúdo do arquivo só pode ser aplicado se o idioma dele combinar com o
    // idioma registrado no banco. Se a operação trocar o idioma de um estudo, a
    // tradução correspondente precisa vir junto — senão repetimos o problema.
    const divergentes = CONTEUDO.filter(
        (item) => existentesMap.get(item.slug)?.language !== item.language
    )
    if (divergentes.length > 0) {
        throw new Error(
            `Idioma divergente entre arquivo e banco: ${divergentes
                .map((item) => `${item.slug} (arquivo=${item.language}, banco=${existentesMap.get(item.slug)?.language})`)
                .join("; ")}`
        )
    }

    for (const item of CONTEUDO) {
        console.log(
            `${dryRun ? "[dry-run] " : ""}${item.slug}  (${item.language}, title=${item.metaTitle.length}, desc=${item.metaDescription.length}, intro=${item.introduction.length})`
        )
        if (dryRun) continue

        await prisma.leadList.update({
            where: { slug: item.slug },
            data: {
                metaTitle: item.metaTitle,
                metaDescription: item.metaDescription,
                introduction: item.introduction,
            },
        })
    }

    console.log(`\n${dryRun ? "Simuladas" : "Atualizadas"} ${CONTEUDO.length} lista(s).`)
    await prisma.$disconnect()
}

main().catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
})
