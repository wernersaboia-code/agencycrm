// components/purchases/purchase-card.tsx
"use client"

import { formatCurrency } from "@/lib/utils"
import { CheckCircle, Download, Database, Calendar, ChevronDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface PurchaseCardProps {
    purchase: {
        id: string
        status: string
        total: number
        currency: string
        createdAt: string
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
}

export function PurchaseCard({ purchase }: PurchaseCardProps) {
    const [expanded, setExpanded] = useState(false)

    const statusColors: Record<string, string> = {
        paid: "bg-emerald-100 text-emerald-700",
        pending: "bg-yellow-100 text-yellow-700",
        failed: "bg-red-100 text-red-700",
        refunded: "bg-gray-100 text-gray-700"
    }

    const statusLabels: Record<string, string> = {
        paid: "Pago",
        pending: "Pendente",
        failed: "Falhou",
        refunded: "Reembolsado"
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header do Card */}
            <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <Database className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-gray-800">
                                    Pedido {purchase.id.slice(0, 8)}...
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[purchase.status]}`}>
                                    {statusLabels[purchase.status] || purchase.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(purchase.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                                <span>{purchase.items.length} lista(s)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xl font-bold text-[#4a2c5a]">
                                {formatCurrency(purchase.total, purchase.currency)}
                            </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </div>

            {/* Conteúdo Expandido */}
            {expanded && (
                <div className="px-6 pb-6 border-t border-gray-100">
                    {/* Lista de Itens */}
                    <div className="mt-4 space-y-3">
                        {purchase.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-[#2ec4b6]" />
                                    <div>
                                        <div className="font-medium text-gray-800">
                                            {item.list.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {item.list.totalLeads.toLocaleString()} leads • {item.list.category}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-800">
                                        {formatCurrency(item.price, purchase.currency)}
                                    </span>
                                    <Button size="sm" variant="outline">
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Ações */}
                    <div className="mt-4 flex gap-3">
                        <Button className="bg-[#4a2c5a] hover:bg-[#5d3a70]">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Tudo (CSV)
                        </Button>
                        <Button variant="outline">
                            Importar para CRM
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}