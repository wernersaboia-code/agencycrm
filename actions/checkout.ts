// actions/checkout.ts
"use server"

import { prisma } from "@/lib/prisma"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Decimal } from "@prisma/client/runtime/library"
import type { Prisma } from "@prisma/client"

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
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Em Server Actions, não podemos setar cookies
                    }
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()
    return { session, supabase }
}

export async function createPurchase(listId: string) {
    try {
        const { session } = await getSession()

        if (!session) {
            return {
                success: false,
                error: "Usuário não autenticado",
                redirect: "/sign-in"
            }
        }

        const userId = session.user.id

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
        const { session } = await getSession()

        if (!session) {
            return null
        }

        const userId = session.user.id

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
        const { session } = await getSession()

        if (!session) {
            return []
        }

        const userId = session.user.id

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

        return purchases.map((purchase: PurchaseWithItems) => ({
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
