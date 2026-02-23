// components/reports/export-leads-buttons.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ExportLeadsButtonsProps {
    workspaceId: string
    filters?: {
        status?: string
        country?: string
        industry?: string
        search?: string
    }
}

export function ExportLeadsButtons({
                                       workspaceId,
                                       filters = {}
                                   }: ExportLeadsButtonsProps) {
    const [isExporting, setIsExporting] = useState<"pdf" | "csv" | "excel" | null>(null)

    const buildUrl = (type: "pdf" | "csv" | "excel") => {
        const params = new URLSearchParams({ workspaceId })

        if (filters.status) params.set("status", filters.status)
        if (filters.country) params.set("country", filters.country)
        if (filters.industry) params.set("industry", filters.industry)
        if (filters.search) params.set("search", filters.search)

        return `/api/reports/leads/${type}?${params.toString()}`
    }

    const handleExport = async (type: "pdf" | "csv" | "excel") => {
        setIsExporting(type)

        try {
            const response = await fetch(buildUrl(type))

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Erro ao exportar")
            }

            // Download do arquivo
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url

            const extensions: Record<string, string> = {
                pdf: "pdf",
                csv: "csv",
                excel: "xlsx",
            }
            a.download = `leads-export.${extensions[type]}`

            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success(`Leads exportados com sucesso!`)
        } catch (error) {
            console.error("Export error:", error)
            toast.error(error instanceof Error ? error.message : "Erro ao exportar")
        } finally {
            setIsExporting(null)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting !== null}>
                    {isExporting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Exportando...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Relatorio PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar Excel
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}