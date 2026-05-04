// actions/my-purchases.ts
"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function getPurchasesByUser(userId: string) {
    try {
        // Verificar se o usuário atual tem permissão
        const user = await requireAuth()

        // Só permite acessar se for o próprio usuário
        if (user.id !== userId) {
            return []
        }

        const purchases = await prisma.purchase.findMany({
            where: {
                userId,
                status: 'paid'
            },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        list: {
                            select: {
                                name: true,
                                slug: true,
                                totalLeads: true,
                                category: true,
                            },
                        },
                    },
                },
            },
        })

        return purchases.map(purchase => ({
            id: purchase.id,
            status: purchase.status,
            total: Number(purchase.total),
            currency: purchase.currency,
            createdAt: purchase.createdAt.toISOString(),
            paidAt: purchase.paidAt?.toISOString(),
            items: purchase.items.map(item => ({
                id: item.id,
                list: {
                    name: item.list.name,
                    slug: item.list.slug,
                    totalLeads: item.list.totalLeads,
                    category: item.list.category,
                },
                price: Number(item.price),
                leadsCount: item.leadsCount,
                downloadCount: item.downloadCount,
                downloadedAt: item.downloadedAt?.toISOString(),
            })),
        }))

    } catch (error) {
        console.error("Erro ao buscar purchases do usuário:", error)
        return []
    }
}

export async function getPurchaseById(purchaseId: string) {
    try {
        const user = await requireAuth()

        const purchase = await prisma.purchase.findUnique({
            where: {
                id: purchaseId,
                userId: user.id,
            },
            include: {
                items: {
                    include: {
                        list: true,
                    },
                },
            },
        })

        if (!purchase) {
            return null
        }

        return {
            id: purchase.id,
            status: purchase.status,
            total: Number(purchase.total),
            currency: purchase.currency,
            createdAt: purchase.createdAt.toISOString(),
            paidAt: purchase.paidAt?.toISOString(),
            items: purchase.items.map(item => ({
                id: item.id,
                list: {
                    id: item.list.id,
                    name: item.list.name,
                    slug: item.list.slug,
                    totalLeads: item.list.totalLeads,
                },
                price: Number(item.price),
                leadsCount: item.leadsCount,
            })),
        }

    } catch (error) {
        console.error("Erro ao buscar purchase:", error)
        return null
    }
}
