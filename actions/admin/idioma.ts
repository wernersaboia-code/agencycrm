// actions/admin/idioma.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { IDIOMAS_DO_PAINEL, type IdiomaDoPainel } from "@/lib/i18n/idiomas-do-painel"

/**
 * Troca o idioma da conta de quem está logado. O painel segue o idioma da
 * CONTA (lib/i18n/admin-locale.ts), e até 09.10.2026 não havia onde mudá-lo:
 * ele só era gravado no cadastro, então as quatro contas ficaram em pt e a
 * tradução alemã do painel era inalcançável para quem administra em alemão.
 *
 * Vale também para os e-mails que o sistema manda a esta pessoa.
 */
export async function alterarIdiomaDoPainel(idioma: string): Promise<{ success: boolean }> {
    const admin = await requireAdmin()
    if (!IDIOMAS_DO_PAINEL.includes(idioma as IdiomaDoPainel)) return { success: false }

    await prisma.user.update({ where: { id: admin.id }, data: { language: idioma } })
    revalidatePath("/super-admin", "layout")
    return { success: true }
}
