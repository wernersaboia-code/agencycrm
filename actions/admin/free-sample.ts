// actions/admin/free-sample.ts
"use server"

import { updateTag } from "next/cache"
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

    // As duas escritas precisam ser atômicas: sem transação, duas chamadas
    // quase simultâneas de ativação podem intercalar (desliga todas de uma,
    // liga a da outra, liga a desta) e deixar DUAS linhas com isActive: true —
    // reabrindo o problema que este comentário do topo diz que a função evita.
    if (isActive) {
        await prisma.$transaction([
            prisma.freeSample.updateMany({ where: { isActive: true }, data: { isActive: false } }),
            prisma.freeSample.update({ where: { id }, data: { isActive } }),
        ])
    } else {
        await prisma.freeSample.update({ where: { id }, data: { isActive } })
    }

    // O admin liga o interruptor e espera ver o efeito na home na hora: precisa
    // ser invalidação IMEDIATA, não stale-while-revalidate. `revalidateTag(tag,
    // "max")` marca a entrada como stale mas ainda serve o conteúdo ANTIGO na
    // primeira visita seguinte (doc do Next: node_modules/next/dist/docs/01-app/
    // 03-api-reference/04-functions/revalidateTag.md) — o interruptor pareceria
    // não funcionar. Como isto roda dentro de uma Server Action, a própria doc
    // recomenda `updateTag`, que expira a tag na hora (read-your-own-writes).
    updateTag(TAG_AMOSTRA)

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
    // Mesmo motivo do toggle: invalidação precisa ser imediata, e esta função
    // também é uma Server Action, então `updateTag` é o jeito certo.
    updateTag(TAG_AMOSTRA)

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
