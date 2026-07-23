"use client"

import { useState } from "react"
import { useFormatter } from "next-intl"
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
    const format = useFormatter()

    const statusColors: Record<string, string> = {
        paid: "bg-indigo-100 text-indigo-700",
        pending: "bg-yellow-100 text-yellow-700",
        failed: "bg-red-100 text-red-700",
        refunded: "bg-muted text-foreground",
    }

    const statusLabels: Record<string, string> = {
        paid: "Pago",
        pending: "Pendente",
        failed: "Falhou",
        refunded: "Reembolsado",
    }

    const downloadPdf = (itemId: string) => {
        window.open(`/api/purchases/${itemId}/download-pdf`, "_blank")
    }

    const handleDownload = (itemId: string) => {
        setDownloading(itemId)
        try {
            downloadPdf(itemId)
            toast.success("Download do PDF iniciado!")
        } catch (error) {
            toast.error("Erro ao fazer download")
            console.error(error)
        } finally {
            setDownloading(null)
        }
    }

    const handleDownloadAll = () => {
        setDownloading("all")
        try {
            for (const item of purchase.items) {
                downloadPdf(item.id)
            }
            toast.success("Downloads iniciados!")
        } catch (error) {
            toast.error("Erro ao fazer downloads")
            console.error(error)
        } finally {
            setDownloading(null)
        }
    }

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            <button
                type="button"
                className="w-full cursor-pointer p-5 text-left transition-colors hover:bg-muted/40"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-blue-600">
                            <Database className="h-6 w-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-foreground">
                                    Pedido #{purchase.id.slice(0, 8)}
                                </h3>
                                <span className={`rounded-md px-2 py-1 text-xs font-medium ${statusColors[purchase.status] || "bg-muted text-foreground"}`}>
                                    {statusLabels[purchase.status] || purchase.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format.dateTime(new Date(purchase.createdAt), "short")}
                                </span>
                                <span>{purchase.items.length} lista(s)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="text-left sm:text-right">
                            <div className="text-xl font-bold text-brand">
                                {formatCurrency(purchase.total, purchase.currency)}
                            </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="border-t border-border px-5 pb-5">
                    <div className="mt-4 space-y-3">
                        {purchase.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col gap-4 rounded-lg bg-muted/40 p-4 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div className="flex flex-1 items-center gap-3">
                                    <CheckCircle className="h-5 w-5 shrink-0 text-brand-accent-strong" />
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-foreground">
                                            {item.list.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {item.list.totalLeads.toLocaleString()} leads - {item.list.category}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <span className="font-medium text-foreground sm:text-right">
                                        {formatCurrency(item.price, purchase.currency)}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDownload(item.id)
                                        }}
                                        disabled={downloading !== null}
                                    >
                                        <Download className={`h-4 w-4 ${downloading === item.id ? "animate-spin" : ""}`} />
                                        Baixar PDF
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {purchase.items.length > 1 && (
                        <div className="mt-4">
                            <Button
                                className="bg-brand hover:bg-brand-hover"
                                onClick={() => handleDownloadAll()}
                                disabled={downloading !== null}
                            >
                                <Download className={`h-4 w-4 ${downloading === "all" ? "animate-spin" : ""}`} />
                                Baixar tudo (PDF)
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
