// actions/admin/free-sample.ts
"use server"

import { revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { recordAudit } from "@/lib/audit"
import { removeFreeSample } from "@/lib/supabase/free-sample"
import { TAG_AMOSTRA } from "@/lib/free-sample/amostra-ativa"

/**
 * Liga ou desliga a amostra. Ligar uma desliga as outras: a home procura a
 * primeira ativa, e duas ativas tornariam imprevisível qual arquivo é servido.
 */
export async function toggleFreeSample(id: string, isActive: boolean) {
    const admin = await requireAdmin()

    if (isActive) {
        await prisma.freeSample.updateMany({ where: { isActive: true }, data: { isActive: false } })
    }
    await prisma.freeSample.update({ where: { id }, data: { isActive } })

    // Sem isto a home continuaria servindo o estado antigo do cache até a tag
    // vencer — o interruptor pareceria não funcionar. Segundo argumento "max"
    // porque esta versão do Next tornou obrigatório declarar o perfil de
    // cache (sem ele, `revalidateTag` funciona mas emite aviso de depreciação).
    revalidateTag(TAG_AMOSTRA, "max")

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: isActive ? "freeSample.activated" : "freeSample.deactivated",
        targetType: "freeSample",
        targetId: id,
    })
}

export async function deleteFreeSample(id: string) {
    const admin = await requireAdmin()

    const amostra = await prisma.freeSample.findUnique({ where: { id } })
    if (!amostra) return

    await prisma.freeSample.delete({ where: { id } })
    await removeFreeSample(amostra.filePath)
    revalidateTag(TAG_AMOSTRA, "max")

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "freeSample.deleted",
        targetType: "freeSample",
        targetId: id,
        metadata: { fileName: amostra.fileName },
    })
}

/**
 * Apaga um pedido. A spec promete que dá para apagar, e sem isto a promessa de
 * privacidade fica sem botão: quem pedir a remoção do próprio endereço teria de
 * ser atendido por SQL na mão.
 */
export async function deleteFreeSampleDownload(id: string) {
    const admin = await requireAdmin()

    await prisma.freeSampleDownload.delete({ where: { id } })

    // Sem metadata: registrar o e-mail apagado no log de auditoria desfaria o
    // apagamento que o registro diz ter acontecido.
    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "freeSampleDownload.deleted",
        targetType: "freeSampleDownload",
        targetId: id,
    })
}

/**
 * CSV de quem pediu a amostra. Aspas duplicadas e campo entre aspas porque
 * e-mail e user-agent podem conter vírgula.
 */
export async function exportFreeSampleDownloadsCSV(): Promise<string> {
    await requireAdmin()

    const linhas = await prisma.freeSampleDownload.findMany({
        orderBy: { createdAt: "desc" },
        select: { email: true, locale: true, consent: true, createdAt: true },
    })

    const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`
    const cabecalho = ["email", "idioma", "consentimento", "data"].join(",")
    const corpo = linhas.map((l) =>
        [
            escapar(l.email),
            escapar(l.locale),
            l.consent ? "sim" : "nao",
            escapar(l.createdAt.toISOString()),
        ].join(",")
    )

    return [cabecalho, ...corpo].join("\n")
}
