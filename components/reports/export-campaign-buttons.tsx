// components/reports/export-campaign-buttons.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ExportCampaignButtonsProps {
    campaignId: string
    campaignName: string
}

export function ExportCampaignButtons({
                                          campaignId,
                                          campaignName
                                      }: ExportCampaignButtonsProps) {
    const [isExporting, setIsExporting] = useState<"pdf" | "csv" | null>(null)

    const handleExport = async (type: "pdf" | "csv") => {
        setIsExporting(type)

        try {
            const response = await fetch(`/api/reports/campaign/${campaignId}/${type}`)

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Erro ao gerar relatório")
            }

            // Download do arquivo
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `relatorio-${campaignName.toLowerCase().replace(/\s+/g, "-")}.${type}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success(`Relatório ${type.toUpperCase()} gerado com sucesso!`)
        } catch (error) {
            console.error("Export error:", error)
            toast.error(error instanceof Error ? error.message : "Erro ao gerar relatório")
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
                            Gerando...
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
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar CSV
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}