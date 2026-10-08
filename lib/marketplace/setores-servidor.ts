// lib/marketplace/setores-servidor.ts
import "server-only"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import type { NomesDoSetor, Setor } from "./setores"

/** Tag revalidada sempre que o admin cria, edita, reordena ou apaga um setor. */
export const TAG_SETORES = "setores"

/**
 * Todos os setores, na ordem do cadastro.
 *
 * Em cache com tag porque entra na home (vitrine de estudos) e em toda página
 * de estudo, e o cadastro muda poucas vezes por mês. O admin chama
 * `updateTag(TAG_SETORES)` a cada alteração, o que também invalida as páginas
 * estáticas que leram daqui.
 */
export const getSetores = unstable_cache(
    async (): Promise<Setor[]> => {
        const linhas = await prisma.industry.findMany({
            orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
            select: { id: true, labels: true, sortOrder: true },
        })
        return linhas.map((linha) => ({
            id: linha.id,
            labels: (linha.labels ?? {}) as NomesDoSetor,
            sortOrder: linha.sortOrder,
        }))
    },
    ["setores"],
    { tags: [TAG_SETORES] }
)
