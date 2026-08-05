// lib/free-sample/amostra-ativa.ts
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

/** Tag revalidada quando o admin liga, desliga ou troca o arquivo. */
export const TAG_AMOSTRA = "free-sample"

/**
 * A amostra ativa, ou `null` quando não há nenhuma.
 *
 * Em cache com tag porque isso entra na HOME, que é a página mais visitada e
 * já teve problema de renderização dinâmica: sem cache, cada visita pagaria
 * uma ida ao banco para descobrir algo que muda uma vez por mês.
 */
export const getAmostraAtiva = unstable_cache(
    async () => {
        try {
            return await prisma.freeSample.findFirst({
                where: { isActive: true },
                select: { id: true },
            })
        } catch (error) {
            // A migração desta feature pode não ter sido aplicada ainda no banco
            // (aplicação fica para a Task 9 / deploy) — `free_samples` pode nem
            // existir. Sem este catch, a query rejeitada derruba a Suspense
            // boundary inteira da home (todas as seções ficam presas no
            // esqueleto de carregamento), o oposto do "publicado invisível"
            // que é o requisito desta feature.
            console.error("Erro ao consultar a amostra ativa:", error)
            return null
        }
    },
    ["free-sample-ativa"],
    { tags: [TAG_AMOSTRA] }
)
