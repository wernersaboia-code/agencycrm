// lib/marketplace/leads-do-pdf.ts
//
// Grava na tabela de leads as empresas lidas do diretório do PDF do estudo,
// com origin = "pdf". SÓ PARA O ADMIN (ver origem-lead.ts): não mexe em
// totalLeads nem em previewData, e o download do comprador não os inclui.
//
// Os leads do PDF acompanham o PDF que está no ar: cada troca, volta à versão
// anterior ou remoção apaga os do PDF antigo e grava os do novo. Leads
// importados por planilha nunca são tocados.

import { prisma } from "@/lib/prisma"
import { extrairLeadsDoPdf } from "./pdf-do-estudo"
import { ORIGEM_PDF } from "./origem-lead"
import { paraRegistro } from "./registro-lead-pdf"

/**
 * Troca os leads do PDF da lista pelos lidos de `bytes`. Com `bytes` nulo (PDF
 * removido), só apaga. Devolve quantos foram gravados, ou `null` quando o PDF
 * não abriu — aí os leads antigos ficam, para uma leitura que falhou não
 * esvaziar a tabela.
 */
export async function regravarLeadsDoPdf(listId: string, bytes: Uint8Array | null): Promise<number | null> {
    const lista = await prisma.leadList.findUnique({
        where: { id: listId },
        select: { id: true, countries: true, industries: true },
    })
    if (!lista) return null

    if (!bytes) {
        await prisma.marketplaceLead.deleteMany({ where: { listId, origin: ORIGEM_PDF } })
        return 0
    }

    const leads = await extrairLeadsDoPdf(bytes)
    if (!leads) return null

    const registros = leads.filter((l) => l.companyName.trim().length >= 2).map((l) => paraRegistro(l, lista))
    const [, criados] = await prisma.$transaction([
        prisma.marketplaceLead.deleteMany({ where: { listId, origin: ORIGEM_PDF } }),
        // skipDuplicates: empresa já importada por planilha (mesmo nome e país)
        // fica com o registro da planilha.
        prisma.marketplaceLead.createMany({ data: registros, skipDuplicates: true }),
    ])
    return criados.count
}
