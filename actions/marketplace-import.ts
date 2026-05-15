// actions/marketplace-import.ts
"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth"
import { LeadSource, LeadStatus } from "@prisma/client"

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
        const user = await requireWorkspaceAccess(workspaceId)
        const userId = user.id

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: {
                id: true,
                name: true,
            },
        })

        if (!workspace) {
            throw new Error("Workspace não encontrado")
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

        // Coletar emails para verificar duplicados em batch
        const emails = marketplaceLeads
            .map((mLead) => mLead.emailGeneral)
            .filter((email): email is string => email !== null)

        const existingLeads = emails.length > 0
            ? await prisma.lead.findMany({
                where: {
                    workspaceId,
                    email: { in: emails },
                },
                select: { email: true },
            })
            : []

        const existingEmails = new Set(existingLeads.map((l) => l.email))

        // Separar leads para criar (batch)
        const leadsToCreate: Array<{
            workspaceId: string
            firstName: string
            lastName: string | null
            email: string
            phone: string | null
            company: string | null
            jobTitle: string | null
            website: string | null
            country: string | null
            industry: string | null
            status: LeadStatus
            source: LeadSource
            importBatch: string
            importedAt: Date
            notes: string
        }> = []

        for (const mLead of marketplaceLeads) {
            if (mLead.emailGeneral && existingEmails.has(mLead.emailGeneral)) {
                skipped++
                continue
            }

            leadsToCreate.push({
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
            })
        }

        // Importar em batches de 100
        const BATCH_SIZE = 100
        for (let i = 0; i < leadsToCreate.length; i += BATCH_SIZE) {
            const batch = leadsToCreate.slice(i, i + BATCH_SIZE)
            try {
                await prisma.lead.createMany({ data: batch, skipDuplicates: true })
                imported += batch.length
            } catch (error) {
                errors.push(`Erro ao importar batch ${i}: ${error}`)
                console.error("Erro ao importar batch:", error)
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
        const user = await requireAuth()

        const workspaces = await prisma.workspace.findMany({
            where: {
                userId: user.id,
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
