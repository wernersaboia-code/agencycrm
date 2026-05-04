// actions/checkout.ts
"use server"

import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import type { Prisma } from "@prisma/client"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"

type PurchaseWithItems = Prisma.PurchaseGetPayload<{
    include: {
        items: {
            include: {
                list: true
            }
        }
    }
}>

type PurchaseItemWithList = PurchaseWithItems["items"][number]

export interface UserPurchase {
    id: string
    status: string
    total: number
    currency: string
    createdAt: string
    paypalOrderId: string | null
    items: {
        id: string
        list: {
            id: string
            name: string
            slug: string
            totalLeads: number
            category: string
        }
        price: number
    }[]
}

async function getActiveCheckoutUser() {
    return getAuthenticatedActiveDbUser()
}

export async function createPurchase(listId: string) {
    try {
        const user = await getActiveCheckoutUser()

        if (!user) {
            return {
                success: false,
                error: "Usuário não autenticado",
                redirect: "/sign-in"
            }
        }

        const userId = user.id

        // Buscar lista
        const list = await prisma.leadList.findUnique({
            where: { id: listId, isActive: true }
        })

        if (!list) {
            return {
                success: false,
                error: "Lista não encontrada"
            }
        }

        const price = new Decimal(list.price)

        // Criar purchase
        const purchase = await prisma.purchase.create({
            data: {
                userId,
                status: "pending",
                subtotal: price,
                total: price,
                currency: list.currency,
                items: {
                    create: {
                        listId,
                        price: price,
                        currency: list.currency,
                        leadsCount: list.totalLeads
                    }
                }
            },
            include: {
                items: {
                    include: {
                        list: true
                    }
                }
            }
        })

        return {
            success: true,
            purchase: {
                id: purchase.id,
                total: Number(purchase.total),
                currency: purchase.currency,
                items: purchase.items.map((item: PurchaseItemWithList) => ({
                    id: item.id,
                    list: {
                        id: item.list.id,
                        name: item.list.name,
                        slug: item.list.slug,
                        price: Number(item.price)
                    }
                }))
            }
        }

    } catch (error) {
        console.error("Erro ao criar purchase:", error)
        return {
            success: false,
            error: "Erro ao criar compra"
        }
    }
}

export async function getPurchase(purchaseId: string) {
    try {
        const user = await getActiveCheckoutUser()

        if (!user) {
            return null
        }

        const userId = user.id

        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId, userId },
            include: {
                items: {
                    include: {
                        list: true
                    }
                }
            }
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
            items: purchase.items.map((item: PurchaseItemWithList) => ({
                id: item.id,
                list: {
                    id: item.list.id,
                    name: item.list.name,
                    slug: item.list.slug,
                    totalLeads: item.list.totalLeads
                },
                price: Number(item.price)
            }))
        }

    } catch (error) {
        console.error("Erro ao buscar purchase:", error)
        return null
    }
}

export async function getUserPurchases() {
    try {
        const user = await getActiveCheckoutUser()

        if (!user) {
            return []
        }

        const userId = user.id

        const purchases = await prisma.purchase.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        list: true
                    }
                }
            }
        })

        return purchases.map((purchase: PurchaseWithItems): UserPurchase => ({
            id: purchase.id,
            status: purchase.status,
            total: Number(purchase.total),
            currency: purchase.currency,
            createdAt: purchase.createdAt.toISOString(),
            paypalOrderId: purchase.paypalOrderId,
            items: purchase.items.map((item: PurchaseItemWithList) => ({
                id: item.id,
                list: {
                    id: item.list.id,
                    name: item.list.name,
                    slug: item.list.slug,
                    totalLeads: item.list.totalLeads,
                    category: item.list.category
                },
                price: Number(item.price)
            }))
        }))

    } catch (error) {
        console.error("Erro ao buscar purchases:", error)
        return []
    }
}

export async function updatePurchaseStatus(
    purchaseId: string,
    status: "pending" | "paid" | "failed" | "refunded",
    paypalOrderId?: string
) {
    try {
        await prisma.purchase.update({
            where: { id: purchaseId },
            data: {
                status,
                paypalOrderId
            }
        })

        return { success: true }

    } catch (error) {
        console.error("Erro ao atualizar purchase:", error)
        return { success: false }
    }
}
