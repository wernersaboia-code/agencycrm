/**
 * Grava na tabela de leads as empresas do diretório de cada estudo, lidas do
 * PDF (ver lib/marketplace/leads-do-diretorio.ts). Roda com
 * `npm run leads:pdf` (simulação) ou `npm run leads:pdf -- --aplicar` (grava).
 *
 * Os leads ficam com origin = "pdf": SÓ PARA O ADMIN. Não mexe em totalLeads
 * nem em previewData, e o download do comprador não os inclui.
 *
 * - SEM `--aplicar` nada é gravado; o script relata quantas empresas acharia.
 * - Com `--aplicar`, apaga os leads "pdf" de cada estudo e grava os novos.
 *   Leads importados por planilha nunca são tocados.
 * - Depois do upload pelo admin isto acontece sozinho; o script serve para o
 *   catálogo que já estava no ar e para reler tudo depois de melhorar a regra.
 */
import { PrismaClient } from "@prisma/client"
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { extrairLeadsDoPdf } from "../lib/marketplace/pdf-do-estudo"
import { paraRegistro } from "../lib/marketplace/registro-lead-pdf"
import { ORIGEM_PDF } from "../lib/marketplace/origem-lead"

config({ path: [".env.local", ".env"] })

const prisma = new PrismaClient()
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
)

const BUCKET = "list-studies"
const aplicar = process.argv.includes("--aplicar")

function caminhoNoBucket(url: string): string {
    const marca = `/${BUCKET}/`
    const indice = url.indexOf(marca)
    return indice === -1 ? url : url.slice(indice + marca.length).split("?")[0]
}

async function main() {
    const listas = await prisma.leadList.findMany({
        where: { studyPdfUrl: { not: null } },
        select: { id: true, slug: true, studyPdfUrl: true, countries: true, industries: true },
        orderBy: { slug: "asc" },
    })

    let total = 0
    let gravados = 0
    for (const lista of listas) {
        const { data, error } = await supabase.storage.from(BUCKET).download(caminhoNoBucket(lista.studyPdfUrl!))
        if (error || !data) {
            console.log(`   ! ${lista.slug}: não baixou (${error?.message})`)
            continue
        }

        const leads = await extrairLeadsDoPdf(new Uint8Array(await data.arrayBuffer()))
        if (!leads) {
            console.log(`   ? ${lista.slug}: PDF não abriu, leads mantidos`)
            continue
        }
        total += leads.length
        console.log(`${String(leads.length).padStart(4)}  ${lista.slug}`)

        if (aplicar) {
            const registros = leads.filter((l) => l.companyName.trim().length >= 2).map((l) => paraRegistro(l, lista))
            const [, criados] = await prisma.$transaction([
                prisma.marketplaceLead.deleteMany({ where: { listId: lista.id, origin: ORIGEM_PDF } }),
                prisma.marketplaceLead.createMany({ data: registros, skipDuplicates: true }),
            ])
            gravados += criados.count
        }
    }

    console.log(`\n${listas.length} estudos · ${total} empresas lidas · ${aplicar ? `${gravados} gravadas` : "simulação, nada gravado"}`)
}

main()
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
