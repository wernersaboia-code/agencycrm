// actions/marketplace-import.ts
"use server"

import { prisma } from "@/lib/prisma"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { LeadSource, LeadStatus } from "@prisma/client"

async function getSession() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll() {
                    // Em Server Actions, não podemos setar cookies
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()
    return { session, supabase }
}

interface ImportToWorkspaceParams {
    purchaseItemId: string
    workspaceId: string
}

interface ImportResult {
    success: boolean
    imported: number
    skipped: number
    totalProcessed: number
    errors: string[]
    workspaceName: string
}

export async function importMarketplaceLeadsToWorkspace({
                                                            purchaseItemId,
                                                            workspaceId,
                                                        }: ImportToWorkspaceParams): Promise<ImportResult> {
    const errors: string[] = []

    try {
        const { session } = await getSession()

        if (!session) {
            throw new Error("Usuário não autenticado")
        }

        const userId = session.user.id

        // Verificar se o workspace pertence ao usuário
        const workspace = await prisma.workspace.findFirst({
            where: {
                id: workspaceId,
                userId,
            },
            select: {
                id: true,
                name: true,
            },
        })

        if (!workspace) {
            throw new Error("Workspace não encontrado ou sem permissão")
        }

        // Buscar o item da compra com a lista
        const purchaseItem = await prisma.purchaseItem.findUnique({
            where: { id: purchaseItemId },
            include: {
                purchase: {
                    select: {
                        userId: true,
                    },
                },
                list: true,
            },
        })

        if (!purchaseItem) {
            throw new Error("Item da compra não encontrado")
        }

        // Verificar se a compra pertence ao usuário
        if (purchaseItem.purchase.userId !== userId) {
            throw new Error("Você não tem permissão para importar esta lista")
        }

        // Verificar se já foi importado para este workspace
        if (purchaseItem.importedTo === workspaceId) {
            throw new Error("Esta lista já foi importada para este workspace")
        }

        // Buscar todos os leads da lista no marketplace
        const marketplaceLeads = await prisma.marketplaceLead.findMany({
            where: {
                listId: purchaseItem.listId,
                isComplete: true, // Apenas leads completos
            },
        })

        if (marketplaceLeads.length === 0) {
            throw new Error("Nenhum lead encontrado nesta lista")
        }

        let imported = 0
        let skipped = 0
        const importBatch = `marketplace_${purchaseItem.listId}_${Date.now()}`

        // Importar cada lead
        for (const mLead of marketplaceLeads) {
            try {
                // Verificar se o lead já existe no workspace (por email)
                if (mLead.emailGeneral) {
                    const existingLead = await prisma.lead.findFirst({
                        where: {
                            workspaceId,
                            email: mLead.emailGeneral,
                        },
                    })

                    if (existingLead) {
                        skipped++
                        continue
                    }
                }

                // Mapear campos do MarketplaceLead para Lead do CRM
                await prisma.lead.create({
                    data: {
                        workspaceId,
                        firstName: mLead.manager?.split(" ")[0] || mLead.companyName || "Contato",
                        lastName: mLead.manager?.split(" ").slice(1).join(" ") || null,
                        email: mLead.emailGeneral || `${mLead.companyName?.toLowerCase().replace(/\s+/g, ".")}@unknown.com`,
                        phone: mLead.phoneGeneral || mLead.phonePurchasing || null,
                        company: mLead.companyName,
                        jobTitle: mLead.manager ? "Manager" : null,
                        website: mLead.website,
                        country: mLead.country,
                        industry: mLead.sector,
                        status: LeadStatus.NEW,
                        source: LeadSource.MARKETPLACE,
                        importBatch,
                        importedAt: new Date(),
                        notes: `Importado do Easy Prospect - Lista: ${purchaseItem.list.name}`,
                    },
                })

                imported++
            } catch (error) {
                errors.push(`Erro ao importar lead ${mLead.companyName}: ${error}`)
                console.error("Erro ao importar lead:", error)
            }
        }

        // Atualizar o item da compra com informação de importação
        await prisma.purchaseItem.update({
            where: { id: purchaseItemId },
            data: {
                importedAt: new Date(),
                importedTo: workspaceId,
            },
        })

        return {
            success: true,
            imported,
            skipped,
            totalProcessed: marketplaceLeads.length,
            errors,
            workspaceName: workspace.name,
        }

    } catch (error) {
        console.error("Erro ao importar leads:", error)
        throw error
    }
}

export async function getUserWorkspaces() {
    try {
        const { session } = await getSession()

        if (!session) {
            return []
        }

        const workspaces = await prisma.workspace.findMany({
            where: {
                userId: session.user.id,
            },
            select: {
                id: true,
                name: true,
                color: true,
                logo: true,
                _count: {
                    select: {
                        leads: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return workspaces.map(workspace => ({
            id: workspace.id,
            name: workspace.name,
            color: workspace.color,
            logo: workspace.logo,
            leadsCount: workspace._count.leads,
        }))

    } catch (error) {
        console.error("Erro ao buscar workspaces:", error)
        return []
    }
}