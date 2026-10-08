/**
 * Estima quantas empresas o diretório de cada estudo lista (ver
 * lib/marketplace/contagem-empresas.ts). Roda com `npm run meta:empresas`
 * (simulação) ou `npm run meta:empresas -- --aplicar` (grava).
 *
 * O número é só do admin, para calibrar preço; nunca aparece no site.
 *
 * - SEM `--aplicar` nada é gravado; o script relata o que faria.
 * - Com `--aplicar`, grava a estimativa em `companyCount` com
 *   `companyCountManual = false`. Número conferido à mão no admin
 *   (`companyCountManual = true`) NUNCA é sobrescrito.
 * - Estudo sem capítulo de diretório reconhecível, ou com PDF ilegível, é
 *   relatado e fica como está.
 * - `--json <arquivo>` grava a contagem completa (com os nomes contados) para
 *   conferência.
 */
import { writeFileSync } from "node:fs"
import { PrismaClient } from "@prisma/client"
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { contarEmpresasDoPdf } from "../lib/marketplace/pdf-do-estudo"

config({ path: [".env.local", ".env"] })

const prisma = new PrismaClient()
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
)

const BUCKET = "list-studies"
const aplicar = process.argv.includes("--aplicar")
const jsonIndice = process.argv.indexOf("--json")
const arquivoJson = jsonIndice !== -1 ? process.argv[jsonIndice + 1] : null

function caminhoNoBucket(url: string): string {
    const marca = `/${BUCKET}/`
    const indice = url.indexOf(marca)
    return indice === -1 ? url : url.slice(indice + marca.length).split("?")[0]
}

async function main() {
    const listas = await prisma.leadList.findMany({
        where: { studyPdfUrl: { not: null } },
        select: { id: true, slug: true, studyPdfUrl: true, companyCount: true, companyCountManual: true },
        orderBy: { slug: "asc" },
    })

    const relatorio: { slug: string; total: number | null; empresas: string[] }[] = []
    let gravadas = 0

    for (const lista of listas) {
        const { data, error } = await supabase.storage.from(BUCKET).download(caminhoNoBucket(lista.studyPdfUrl!))
        if (error || !data) {
            console.log(`   ! ${lista.slug}: não baixou (${error?.message})`)
            relatorio.push({ slug: lista.slug, total: null, empresas: [] })
            continue
        }

        const contagem = await contarEmpresasDoPdf(new Uint8Array(await data.arrayBuffer()))
        relatorio.push({ slug: lista.slug, total: contagem?.total ?? null, empresas: contagem?.empresas ?? [] })

        const rotulo = contagem ? String(contagem.total).padStart(4) : "   ?"
        const nota = lista.companyCountManual ? " (manual, mantido)" : ""
        console.log(`${rotulo}  ${lista.slug}${nota}`)

        if (aplicar && contagem && !lista.companyCountManual && lista.companyCount !== contagem.total) {
            await prisma.leadList.update({
                where: { id: lista.id },
                data: { companyCount: contagem.total, companyCountManual: false },
            })
            gravadas++
        }
    }

    const semDiretorio = relatorio.filter((r) => r.total === null).length
    console.log(`\n${listas.length} estudos · ${semDiretorio} sem diretório reconhecido · ${aplicar ? `${gravadas} gravados` : "simulação, nada gravado"}`)
    if (arquivoJson) writeFileSync(arquivoJson, JSON.stringify(relatorio, null, 2))
}

main()
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
