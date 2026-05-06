"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle, ChevronDown, Database, Download } from "lucide-react"
import { toast } from "sonner"

interface PurchaseItem {
    id: string
    list: {
        id?: string
        name: string
        slug: string
        totalLeads: number
        category: string
    }
    price: number
}

interface PublicPurchaseCardProps {
    purchase: {
        id: string
        status: string
        total: number
        currency: string
        createdAt: string
        items: PurchaseItem[]
    }
}

export function PublicPurchaseCard({ purchase }: PublicPurchaseCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [downloading, setDownloading] = useState<string | null>(null)

    const statusColors: Record<string, string> = {
        paid: "bg-emerald-100 text-emerald-700",
        pending: "bg-yellow-100 text-yellow-700",
        failed: "bg-red-100 text-red-700",
        refunded: "bg-gray-100 text-gray-700",
    }

    const statusLabels: Record<string, string> = {
        paid: "Pago",
        pending: "Pendente",
        failed: "Falhou",
        refunded: "Reembolsado",
    }

    const downloadFile = async (itemId: string, format: "csv" | "excel", itemName: string) => {
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
    }

    const handleDownload = async (itemId: string, format: "csv" | "excel", itemName: string) => {
        setDownloading(`${itemId}-${format}`)

        try {
            await downloadFile(itemId, format, itemName)
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
            for (const item of purchase.items) {
                await downloadFile(item.id, format, item.list.slug)
                await new Promise((resolve) => setTimeout(resolve, 500))
            }

            toast.success("Todos os arquivos foram baixados!")
        } catch (error) {
            toast.error("Erro ao fazer downloads")
            console.error(error)
        } finally {
            setDownloading(null)
        }
    }

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <button
                type="button"
                className="w-full cursor-pointer p-5 text-left transition-colors hover:bg-gray-50"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600">
                            <Database className="h-6 w-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-gray-800">
                                    Pedido #{purchase.id.slice(0, 8)}
                                </h3>
                                <span className={`rounded-md px-2 py-1 text-xs font-medium ${statusColors[purchase.status] || "bg-gray-100 text-gray-700"}`}>
                                    {statusLabels[purchase.status] || purchase.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(purchase.createdAt).toLocaleDateString("pt-BR")}
                                </span>
                                <span>{purchase.items.length} lista(s)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="text-left sm:text-right">
                            <div className="text-xl font-bold text-[#4a2c5a]">
                                {formatCurrency(purchase.total, purchase.currency)}
                            </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="border-t border-gray-100 px-5 pb-5">
                    <div className="mt-4 space-y-3">
                        {purchase.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col gap-4 rounded-lg bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div className="flex flex-1 items-center gap-3">
                                    <CheckCircle className="h-5 w-5 shrink-0 text-[#2ec4b6]" />
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-gray-800">
                                            {item.list.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {item.list.totalLeads.toLocaleString()} leads - {item.list.category}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <span className="font-medium text-gray-800 sm:text-right">
                                        {formatCurrency(item.price, purchase.currency)}
                                    </span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDownload(item.id, "csv", item.list.slug)
                                            }}
                                            disabled={downloading !== null}
                                        >
                                            {downloading === `${item.id}-csv` ? (
                                                <>
                                                    <Download className="h-4 w-4 animate-spin" />
                                                    Baixando...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="h-4 w-4" />
                                                    CSV
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDownload(item.id, "excel", item.list.slug)
                                            }}
                                            disabled={downloading !== null}
                                        >
                                            {downloading === `${item.id}-excel` ? (
                                                <>
                                                    <Download className="h-4 w-4 animate-spin" />
                                                    Baixando...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="h-4 w-4" />
                                                    Excel
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {purchase.items.length > 1 && (
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <Button
                                className="bg-[#4a2c5a] hover:bg-[#5d3a70]"
                                onClick={() => handleDownloadAll("csv")}
                                disabled={downloading !== null}
                            >
                                {downloading === "all-csv" ? (
                                    <>
                                        <Download className="h-4 w-4 animate-spin" />
                                        Baixando...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        Baixar tudo em CSV
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
                                        <Download className="h-4 w-4 animate-spin" />
                                        Baixando...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        Baixar tudo em Excel
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
