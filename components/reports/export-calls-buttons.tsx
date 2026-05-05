// components/reports/export-calls-buttons.tsx
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
import { Download, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
    createReportFileName,
    downloadResponseBlob,
    type ReportFormat,
} from "@/lib/reports/export-client"

interface ExportCallsButtonsProps {
    workspaceId: string
    filters?: {
        startDate?: string
        endDate?: string
        result?: string
        campaignId?: string
    }
}

export function ExportCallsButtons({
                                       workspaceId,
                                       filters = {}
                                   }: ExportCallsButtonsProps) {
    const [isExporting, setIsExporting] = useState<Extract<ReportFormat, "pdf" | "csv"> | null>(null)

    const buildUrl = (type: Extract<ReportFormat, "pdf" | "csv">) => {
        const params = new URLSearchParams({ workspaceId })

        if (filters.startDate) params.set("startDate", filters.startDate)
        if (filters.endDate) params.set("endDate", filters.endDate)
        if (filters.result) params.set("result", filters.result)
        if (filters.campaignId) params.set("campaignId", filters.campaignId)

        return `/api/reports/calls/${type}?${params.toString()}`
    }

    const handleExport = async (type: Extract<ReportFormat, "pdf" | "csv">) => {
        setIsExporting(type)

        try {
            const response = await fetch(buildUrl(type))

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Erro ao exportar")
            }

            await downloadResponseBlob(response, createReportFileName(["ligacoes"], type))

            toast.success(`Ligações exportadas com sucesso!`)
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
                    Relatório PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Exportar CSV
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
