// components/purchases/purchase-card.tsx
"use client"

import { formatCurrency } from "@/lib/utils"
import { CheckCircle, Download, Database, Calendar, ChevronDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { UserPurchase } from "@/actions/checkout"

interface PurchaseCardProps {
    purchase: UserPurchase
}

export function PurchaseCard({ purchase }: PurchaseCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [downloading, setDownloading] = useState<string | null>(null)

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

    const handleDownload = async (itemId: string, format: "csv" | "excel", itemName: string) => {
        setDownloading(`${itemId}-${format}`)

        try {
            const endpoint =
                format === "csv"
                    ? `/api/purchases/${itemId}/download`
                    : `/api/purchases/${itemId}/download-excel`

            const response = await fetch(endpoint)

            if (!response.ok) {
                throw new Error("Erro ao baixar arquivo")
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${itemName}.${format === "csv" ? "csv" : "xlsx"}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success(`Download de ${format.toUpperCase()} iniciado!`)
        } catch (error) {
            toast.error("Erro ao fazer download")
            console.error(error)
        } finally {
            setDownloading(null)
        }
    }

    const handleDownloadAll = async (format: "csv" | "excel") => {
        setDownloading(`all-${format}`)

        try {
            // Download de cada item sequencialmente
            for (const item of purchase.items) {
                await handleDownload(item.id, format, item.list.slug)
                // Pequeno delay entre downloads
                await new Promise((resolve) => setTimeout(resolve, 500))
            }

            toast.success(`Todos os arquivos foram baixados!`)
        } catch (error) {
            toast.error("Erro ao fazer downloads")
            console.error(error)
        } finally {
            setDownloading(null)
        }
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
                                    Pedido #{purchase.id.slice(0, 8)}
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
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownload(item.id, "csv", item.list.slug)}
                                            disabled={downloading !== null}
                                        >
                                            {downloading === `${item.id}-csv` ? (
                                                <>
                                                    <Download className="h-4 w-4 mr-1 animate-spin" />
                                                    Baixando...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="h-4 w-4 mr-1" />
                                                    CSV
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownload(item.id, "excel", item.list.slug)}
                                            disabled={downloading !== null}
                                        >
                                            {downloading === `${item.id}-excel` ? (
                                                <>
                                                    <Download className="h-4 w-4 mr-1 animate-spin" />
                                                    Baixando...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Excel
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Ações */}
                    {purchase.items.length > 1 && (
                        <div className="mt-4 flex gap-3">
                            <Button
                                className="bg-[#4a2c5a] hover:bg-[#5d3a70]"
                                onClick={() => handleDownloadAll("csv")}
                                disabled={downloading !== null}
                            >
                                {downloading === "all-csv" ? (
                                    <>
                                        <Download className="h-4 w-4 mr-2 animate-spin" />
                                        Baixando...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Baixar Tudo (CSV)
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleDownloadAll("excel")}
                                disabled={downloading !== null}
                            >
                                {downloading === "all-excel" ? (
                                    <>
                                        <Download className="h-4 w-4 mr-2 animate-spin" />
                                        Baixando...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Baixar Tudo (Excel)
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
