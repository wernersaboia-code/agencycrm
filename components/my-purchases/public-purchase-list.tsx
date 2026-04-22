// components/my-purchases/public-purchase-list.tsx
"use client"

import { useState } from "react"
import { PublicPurchaseCard } from "@/components/marketplace/public-purchase-card"
import { Package, FileSpreadsheet, Download } from "lucide-react"

// Interface compatível com o que vem do banco
interface PurchaseItem {
    id: string
    list: {
        name: string
        slug: string
        totalLeads: number
        category: string
    }
    price: number
    leadsCount: number
    downloadCount: number
    downloadedAt?: string
    importedTo?: string | null
}

interface Purchase {
    id: string
    status: string
    total: number
    currency: string
    createdAt: string
    paidAt?: string
    items: PurchaseItem[]
}

interface PublicPurchaseListProps {
    purchases: Purchase[]
    userEmail: string
}

export function PublicPurchaseList({ purchases, userEmail }: PublicPurchaseListProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const totalLeads = purchases.reduce((acc, p) =>
        acc + p.items.reduce((sum, item) => sum + item.leadsCount, 0
        ), 0)

    const totalLists = purchases.reduce((acc, p) => acc + p.items.length, 0)

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <Package className="w-8 h-8 text-[#2ec4b6] mb-2" />
                    <div className="text-3xl font-bold text-gray-800">{purchases.length}</div>
                    <div className="text-gray-600">Total de Compras</div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <FileSpreadsheet className="w-8 h-8 text-[#2ec4b6] mb-2" />
                    <div className="text-3xl font-bold text-gray-800">{totalLists}</div>
                    <div className="text-gray-600">Listas Adquiridas</div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <Download className="w-8 h-8 text-[#2ec4b6] mb-2" />
                    <div className="text-3xl font-bold text-gray-800">{totalLeads.toLocaleString()}</div>
                    <div className="text-gray-600">Total de Leads</div>
                </div>
            </div>

            {/* Email do usuário */}
            <div className="bg-white rounded-lg p-4 border border-gray-100">
                <p className="text-sm text-gray-500">
                    Logado como: <span className="font-medium text-gray-700">{userEmail}</span>
                </p>
            </div>

            {/* Lista de Compras */}
            <div className="space-y-4">
                {purchases.map((purchase) => (
                    <PublicPurchaseCard
                        key={purchase.id}
                        purchase={{
                            id: purchase.id,
                            status: purchase.status,
                            total: purchase.total,
                            currency: purchase.currency,
                            createdAt: purchase.createdAt,
                            items: purchase.items.map(item => ({
                                id: item.id,
                                list: {
                                    name: item.list.name,
                                    slug: item.list.slug,
                                    totalLeads: item.list.totalLeads,
                                    category: item.list.category,
                                },
                                price: item.price,
                                importedTo: item.importedTo,
                            })),
                        }}
                    />
                ))}
            </div>

            {purchases.length === 0 && (
                <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600">Nenhuma compra encontrada</h3>
                    <p className="text-gray-500 mt-2">
                        Você ainda não realizou nenhuma compra no Easy Prospect.
                    </p>
                    <a
                        href="/catalog"
                        className="mt-6 inline-block bg-[#4a2c5a] text-white px-6 py-3 rounded-lg hover:bg-[#5d3a70] transition"
                    >
                        Explorar Catálogo →
                    </a>
                </div>
            )}
        </div>
    )
}