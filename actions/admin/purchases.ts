// actions/admin/purchases.ts
"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { recordAudit } from "@/lib/audit"
import { checkAdminRateLimit } from "@/lib/rate-limit"
import type { ActionResult } from "@/lib/admin/action-errors"

/**
 * Marca ou desmarca uma compra como teste. Só muda as métricas do painel
 * (receita, contagens, ticket médio): o acesso do comprador ao PDF continua o
 * mesmo, e a compra segue aparecendo na tabela de Vendas.
 */
export async function marcarCompraDeTeste(id: string, isTest: boolean): Promise<ActionResult<null>> {
    const admin = await requireAdmin()
    await checkAdminRateLimit("purchase.test_flag", admin.id, 30, 60_000)

    const parsed = z.object({ id: z.string().min(1).max(64), isTest: z.boolean() }).safeParse({ id, isTest })
    if (!parsed.success) return { success: false, error: "Dados inválidos." }

    const atualizada = await prisma.purchase.updateMany({
        where: { id: parsed.data.id },
        data: { isTest: parsed.data.isTest },
    })
    if (atualizada.count === 0) return { success: false, error: "Compra não encontrada." }

    await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "purchase.test_flag_changed",
        targetType: "purchase",
        targetId: parsed.data.id,
        metadata: { isTest: parsed.data.isTest },
    })

    revalidatePath("/super-admin")
    revalidatePath("/super-admin/marketplace")
    revalidatePath("/super-admin/marketplace/purchases")
    revalidatePath("/super-admin/marketplace/lists")
    revalidatePath("/super-admin/analytics")
    return { success: true, data: null }
}
