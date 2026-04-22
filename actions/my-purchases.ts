// actions/my-purchases.ts
"use server"

import { prisma } from "@/lib/prisma"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

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

export async function getPurchasesByUser(userId: string) {
    try {
        // Verificar se o usuário atual tem permissão
        const { session } = await getSession()

        // Se não tem sessão, não pode acessar
        if (!session) {
            return []
        }

        // Só permite acessar se for o próprio usuário
        if (session.user.id !== userId) {
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
        const { session } = await getSession()

        if (!session) {
            return null
        }

        const purchase = await prisma.purchase.findUnique({
            where: {
                id: purchaseId,
                userId: session.user.id,
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