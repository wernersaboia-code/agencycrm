// components/admin/export-workspace-button.tsx

"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, Loader2, FileJson, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportWorkspaceData } from "@/actions/admin/workspaces"

interface ExportWorkspaceButtonProps {
    workspaceId: string
    workspaceName: string
}

export function ExportWorkspaceButton({ workspaceId, workspaceName }: ExportWorkspaceButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleExport = async (format: "json" | "csv") => {
        setIsLoading(true)
        try {
            const data = await exportWorkspaceData(workspaceId)

            if (format === "json") {
                // Exportar como JSON
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                })
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.href = url
                link.download = `${workspaceName.toLowerCase().replace(/\s+/g, "-")}-export.json`
                link.click()
                URL.revokeObjectURL(url)
            } else {
                // Exportar leads como CSV
                const headers = [
                    "Nome",
                    "Sobrenome",
                    "Email",
                    "Telefone",
                    "Empresa",
                    "Cargo",
                    "Status",
                    "Fonte",
                    "País",
                    "Cidade",
                    "Criado em",
                ]
                const rows = data.leads.map((lead) => [
                    lead.firstName,
                    lead.lastName || "",
                    lead.email,
                    lead.phone || "",
                    lead.company || "",
                    lead.jobTitle || "",
                    lead.status,
                    lead.source,
                    lead.country || "",
                    lead.city || "",
                    lead.createdAt,
                ])

                const csvContent = [
                    headers.join(","),
                    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
                ].join("\n")

                const blob = new Blob(["\uFEFF" + csvContent], {
                    type: "text/csv;charset=utf-8;",
                })
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.href = url
                link.download = `${workspaceName.toLowerCase().replace(/\s+/g, "-")}-leads.csv`
                link.click()
                URL.revokeObjectURL(url)
            }

            toast.success(`Exportação ${format.toUpperCase()} concluída!`)
        } catch {
            toast.error("Erro ao exportar dados")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Exportar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                    <FileJson className="h-4 w-4 mr-2" />
                    Exportar JSON (Completo)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar CSV (Leads)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
