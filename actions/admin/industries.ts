// actions/admin/industries.ts
"use server"

import { revalidatePath, updateTag } from "next/cache"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { recordAudit } from "@/lib/audit"
import { checkAdminRateLimit } from "@/lib/rate-limit"
import type { ActionResult } from "@/lib/admin/action-errors"
import { TAG_SETORES } from "@/lib/marketplace/setores-servidor"
import { TAG_RESUMO_CATALOGO } from "@/lib/marketplace/resumo-catalogo"
import { setorCriacaoSchema, setorEdicaoSchema, type NomesDoSetor } from "@/lib/marketplace/setores"

export interface SetorAdmin {
    id: string
    labels: NomesDoSetor
    sortOrder: number
    /** Quantas listas (publicadas ou não) usam o setor. Com uso, não se apaga. */
    listas: number
}

/**
 * O nome do setor aparece no catálogo, no card de estudo e na página de cada
 * estudo. `updateTag` (e não `revalidateTag`) porque isto roda em Server Action
 * e precisa valer na hora — mesmo motivo de actions/admin/lists.ts.
 */
function revalidarSetores() {
    updateTag(TAG_SETORES)
    updateTag(TAG_RESUMO_CATALOGO)
    revalidatePath("/super-admin/marketplace/industries")
    revalidatePath("/super-admin/marketplace/lists")
    revalidatePath("/catalog")
}

async function contarUso(): Promise<Map<string, number>> {
    const listas = await prisma.leadList.findMany({ select: { industries: true } })
    const uso = new Map<string, number>()
    for (const lista of listas) {
        for (const id of lista.industries) uso.set(id, (uso.get(id) ?? 0) + 1)
    }
    return uso
}

export async function listarSetoresAdmin(): Promise<SetorAdmin[]> {
    await requireAdmin()
    const [setores, uso] = await Promise.all([
        prisma.industry.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
        contarUso(),
    ])
    return setores.map((setor) => ({
        id: setor.id,
        labels: (setor.labels ?? {}) as NomesDoSetor,
        sortOrder: setor.sortOrder,
        listas: uso.get(setor.id) ?? 0,
    }))
}

export async function criarSetor(input: unknown): Promise<ActionResult<{ id: string }>> {
    const admin = await requireAdmin()
    await checkAdminRateLimit("industry.create", admin.id, 20, 60_000)

    const parsed = setorCriacaoSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: "Preencha o slug (minúsculas, números e _) e o nome nos sete idiomas." }
    }

    try {
        // Setor novo entra no fim da lista; a ordem se ajusta depois.
        const ultimo = await prisma.industry.aggregate({ _max: { sortOrder: true } })
        await prisma.industry.create({
            data: {
                id: parsed.data.id,
                labels: parsed.data.labels,
                sortOrder: (ultimo._max.sortOrder ?? 0) + 10,
            },
        })
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return { success: false, error: `Já existe um setor com o slug "${parsed.data.id}".` }
        }
        throw error
    }

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "industry.created",
        targetType: "industry",
        targetId: parsed.data.id,
        metadata: { labels: parsed.data.labels },
    })

    revalidarSetores()
    return { success: true, data: { id: parsed.data.id } }
}

/** Edita só os nomes: o slug está gravado nas listas e nos links do filtro. */
export async function atualizarSetor(id: string, input: unknown): Promise<ActionResult<null>> {
    const admin = await requireAdmin()
    await checkAdminRateLimit("industry.update", admin.id, 30, 60_000)

    const parsed = setorEdicaoSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: "O nome do setor é obrigatório nos sete idiomas." }
    }

    const antes = await prisma.industry.findUnique({ where: { id } })
    if (!antes) return { success: false, error: "Setor não encontrado." }

    await prisma.industry.update({ where: { id }, data: { labels: parsed.data.labels } })

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "industry.updated",
        targetType: "industry",
        targetId: id,
        metadata: { antes: antes.labels, depois: parsed.data.labels },
    })

    revalidarSetores()
    return { success: true, data: null }
}

/** Troca o setor de lugar com o vizinho de cima ou de baixo. */
export async function moverSetor(id: string, direcao: "up" | "down"): Promise<ActionResult<null>> {
    const admin = await requireAdmin()
    await checkAdminRateLimit("industry.reorder", admin.id, 60, 60_000)

    const setores = await prisma.industry.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true },
    })
    const indice = setores.findIndex((setor) => setor.id === id)
    if (indice === -1) return { success: false, error: "Setor não encontrado." }

    const alvo = direcao === "up" ? indice - 1 : indice + 1
    if (alvo < 0 || alvo >= setores.length) return { success: true, data: null }

    // Renumera tudo em vez de só trocar os dois valores: setores com o mesmo
    // sortOrder (ou vindos de fora do admin) não teriam o que trocar.
    const ordem = setores.map((setor) => setor.id)
    ;[ordem[indice], ordem[alvo]] = [ordem[alvo], ordem[indice]]

    await prisma.$transaction(
        ordem.map((setorId, posicao) =>
            prisma.industry.update({ where: { id: setorId }, data: { sortOrder: (posicao + 1) * 10 } })
        )
    )

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "industry.reordered",
        targetType: "industry",
        targetId: id,
        metadata: { direcao },
    })

    revalidarSetores()
    return { success: true, data: null }
}

/**
 * Só apaga setor sem nenhuma lista. Com uso, o filtro passaria a mostrar o
 * slug cru nos estudos que o têm — o admin tira o setor das listas antes.
 */
export async function apagarSetor(id: string): Promise<ActionResult<null>> {
    const admin = await requireAdmin()
    await checkAdminRateLimit("industry.delete", admin.id, 20, 60_000)

    const emUso = await prisma.leadList.count({ where: { industries: { has: id } } })
    if (emUso > 0) {
        return {
            success: false,
            error: `O setor está em ${emUso} lista(s). Tire-o dessas listas antes de apagar.`,
        }
    }

    const apagado = await prisma.industry.deleteMany({ where: { id } })
    if (apagado.count === 0) return { success: false, error: "Setor não encontrado." }

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "industry.deleted",
        targetType: "industry",
        targetId: id,
    })

    revalidarSetores()
    return { success: true, data: null }
}
