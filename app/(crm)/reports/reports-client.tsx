// app/(crm)/reports/reports-client.tsx
"use client"

import { useState } from "react"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import {
    FileText,
    Users,
    Mail,
    Phone,
    TrendingUp,
    Download,
    FileSpreadsheet,
    Calendar,
    Loader2,
    BarChart3,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

// ============================================================
// TIPOS
// ============================================================

interface ReportsClientProps {
    workspace: {
        id: string
        name: string
        color: string
        logo: string | null
    }
    campaigns: { id: string; name: string }[]
    stats: {
        leads: number
        campaigns: number
        calls: number
        emailsSent: number
    }
}

type ExportType = "pdf" | "csv" | "excel"
type ReportType = "leads" | "calls" | "executive"

interface ExportingState {
    type: ReportType
    format: ExportType
}

// ============================================================
// CONSTANTES
// ============================================================

const PERIOD_OPTIONS = [
    { value: "7", label: "Últimos 7 dias" },
    { value: "30", label: "Últimos 30 dias" },
    { value: "60", label: "Últimos 60 dias" },
    { value: "90", label: "Últimos 90 dias" },
    { value: "month", label: "Este mês" },
    { value: "lastMonth", label: "Mês passado" },
    { value: "custom", label: "Período personalizado" },
]

// ============================================================
// COMPONENTE
// ============================================================

export function ReportsClient({ workspace, campaigns, stats }: ReportsClientProps) {
    const [period, setPeriod] = useState("30")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [selectedCampaign, setSelectedCampaign] = useState("all")
    const [isExporting, setIsExporting] = useState<ExportingState | null>(null)

    // ============================================================
    // HELPERS
    // ============================================================

    const getDateRange = (): { start: string; end: string } => {
        const today = new Date()
        let start: Date
        let end: Date = today

        switch (period) {
            case "7":
                start = subDays(today, 7)
                break
            case "30":
                start = subDays(today, 30)
                break
            case "60":
                start = subDays(today, 60)
                break
            case "90":
                start = subDays(today, 90)
                break
            case "month":
                start = startOfMonth(today)
                end = endOfMonth(today)
                break
            case "lastMonth":
                const lastMonth = subMonths(today, 1)
                start = startOfMonth(lastMonth)
                end = endOfMonth(lastMonth)
                break
            case "custom":
                return {
                    start: dateFrom || format(subDays(today, 30), "yyyy-MM-dd"),
                    end: dateTo || format(today, "yyyy-MM-dd"),
                }
            default:
                start = subDays(today, 30)
        }

        return {
            start: format(start, "yyyy-MM-dd"),
            end: format(end, "yyyy-MM-dd"),
        }
    }

    const buildUrl = (reportType: ReportType, exportType: ExportType): string => {
        const params = new URLSearchParams({ workspaceId: workspace.id })
        const { start, end } = getDateRange()

        params.set("startDate", start)
        params.set("endDate", end)

        if (reportType === "calls" && selectedCampaign !== "all") {
            params.set("campaignId", selectedCampaign)
        }

        if (reportType === "executive") {
            return `/api/reports/executive/pdf?${params.toString()}`
        }

        return `/api/reports/${reportType}/${exportType}?${params.toString()}`
    }

    // ============================================================
    // HANDLERS
    // ============================================================

    const handleExport = async (reportType: ReportType, exportType: ExportType) => {
        setIsExporting({ type: reportType, format: exportType })

        try {
            const url = buildUrl(reportType, exportType)
            const response = await fetch(url)

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Erro ao gerar relatório")
            }

            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = downloadUrl

            const extensions: Record<ExportType, string> = {
                pdf: "pdf",
                csv: "csv",
                excel: "xlsx",
            }
            a.download = `relatorio-${reportType}-${format(new Date(), "yyyy-MM-dd")}.${extensions[exportType]}`

            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(downloadUrl)
            document.body.removeChild(a)

            toast.success("Relatório gerado com sucesso!")
        } catch (error) {
            console.error("Export error:", error)
            toast.error(error instanceof Error ? error.message : "Erro ao gerar relatório")
        } finally {
            setIsExporting(null)
        }
    }

    const isExportingReport = (type: ReportType, format?: ExportType): boolean => {
        if (!isExporting) return false
        if (format) return isExporting.type === type && isExporting.format === format
        return isExporting.type === type
    }

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6" />
                    <h1 className="text-3xl font-bold tracking-tight">Central de Relatórios</h1>
                </div>
                <p className="text-muted-foreground mt-1">
                    Gere relatórios profissionais para {workspace.name}
                </p>
            </div>

            {/* Stats rápidos */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Leads</p>
                                <p className="text-xl font-bold">{stats.leads}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Campanhas</p>
                                <p className="text-xl font-bold">{stats.campaigns}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Phone className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Ligações</p>
                                <p className="text-xl font-bold">{stats.calls}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Emails Enviados</p>
                                <p className="text-xl font-bold">{stats.emailsSent}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros de período */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Período dos Relatórios
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Período</Label>
                            <Select value={period} onValueChange={setPeriod}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PERIOD_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {period === "custom" && (
                            <>
                                <div className="space-y-2">
                                    <Label>De</Label>
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-[160px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Até</Label>
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-[160px]"
                                    />
                                </div>
                            </>
                        )}

                        <Badge variant="secondary" className="h-9 px-3">
                            {(() => {
                                const { start, end } = getDateRange()
                                return `${format(new Date(start), "dd/MM/yyyy")} - ${format(new Date(end), "dd/MM/yyyy")}`
                            })()}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Grid de Relatórios */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Relatório Executivo */}
                <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-primary" />
                            </div>
                            <Badge>Recomendado</Badge>
                        </div>
                        <CardTitle className="mt-4">Relatório Executivo</CardTitle>
                        <CardDescription>
                            Resumo completo do período com todas as métricas de leads, campanhas e ligações.
                            Ideal para enviar ao cliente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Resumo geral de performance</li>
                            <li>• Métricas de leads por status</li>
                            <li>• Performance das campanhas</li>
                            <li>• Estatísticas de ligações</li>
                            <li>• Gráficos e indicadores</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            onClick={() => handleExport("executive", "pdf")}
                            disabled={isExportingReport("executive")}
                        >
                            {isExportingReport("executive", "pdf") ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Gerar Relatório PDF
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Relatório de Leads */}
                <Card>
                    <CardHeader>
                        <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="mt-4">Relatório de Leads</CardTitle>
                        <CardDescription>
                            Lista completa de leads com status, origem e estatísticas detalhadas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Todos os leads do workspace</li>
                            <li>• Distribuição por status</li>
                            <li>• Distribuição por país/segmento</li>
                            <li>• Dados completos para análise</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button
                            variant="default"
                            className="flex-1"
                            onClick={() => handleExport("leads", "pdf")}
                            disabled={isExportingReport("leads")}
                        >
                            {isExportingReport("leads", "pdf") ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <FileText className="mr-2 h-4 w-4" />
                                    PDF
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleExport("leads", "csv")}
                            disabled={isExportingReport("leads")}
                        >
                            {isExportingReport("leads", "csv") ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    CSV
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleExport("leads", "excel")}
                            disabled={isExportingReport("leads")}
                        >
                            {isExportingReport("leads", "excel") ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Excel
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Relatório de Ligações */}
                <Card>
                    <CardHeader>
                        <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Phone className="h-6 w-6 text-purple-600" />
                        </div>
                        <CardTitle className="mt-4">Relatório de Ligações</CardTitle>
                        <CardDescription>
                            Histórico de ligações realizadas com resultados e métricas de conversão.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Todas as ligações do período</li>
                                <li>• Taxa de atendimento</li>
                                <li>• Resultados por tipo</li>
                                <li>• Callbacks pendentes</li>
                            </ul>

                            {campaigns.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-xs">Filtrar por campanha (opcional)</Label>
                                    <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Todas as campanhas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas as campanhas</SelectItem>
                                            {campaigns.map((campaign) => (
                                                <SelectItem key={campaign.id} value={campaign.id}>
                                                    {campaign.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button
                            variant="default"
                            className="flex-1"
                            onClick={() => handleExport("calls", "pdf")}
                            disabled={isExportingReport("calls")}
                        >
                            {isExportingReport("calls", "pdf") ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <FileText className="mr-2 h-4 w-4" />
                                    PDF
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleExport("calls", "csv")}
                            disabled={isExportingReport("calls")}
                        >
                            {isExportingReport("calls", "csv") ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    CSV
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Dica */}
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base">💡 Dica</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            <strong>Relatório Executivo:</strong> Ideal para enviar ao seu cliente como
                            prestação de contas mensal.
                        </p>
                        <p>
                            <strong>PDF:</strong> Melhor para apresentações e envio por email.
                        </p>
                        <p>
                            <strong>CSV/Excel:</strong> Melhor para análises e importação em outras ferramentas.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
