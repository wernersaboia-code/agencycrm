// app/(crm)/reports/reports-client.tsx
"use client"

import { useState } from "react"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
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
    ClipboardList,
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
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { createReportFileName, downloadResponseBlob } from "@/lib/reports/export-client"

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
    const hasLeads = stats.leads > 0
    const hasCalls = stats.calls > 0
    const hasCampaigns = stats.campaigns > 0 || stats.emailsSent > 0
    const hasOperationalData = hasLeads || hasCalls || hasCampaigns
    const readinessItems = [
        {
            label: "Base de leads",
            description: hasLeads
                ? `${stats.leads} lead${stats.leads !== 1 ? "s" : ""} na base para análise.`
                : "Importe leads para gerar relatórios úteis.",
            done: hasLeads,
            reportType: "leads" as ReportType,
            action: hasLeads ? "Exportar leads" : "Importar leads",
            href: hasLeads ? null : "/leads/import",
        },
        {
            label: "Atividade comercial",
            description: hasCalls
                ? `${stats.calls} ligação${stats.calls !== 1 ? "ões" : ""} registrada${stats.calls !== 1 ? "s" : ""}.`
                : "Registre ligações para medir callbacks e conversão.",
            done: hasCalls,
            reportType: "calls" as ReportType,
            action: hasCalls ? "Exportar ligações" : "Ver ligações",
            href: hasCalls ? null : "/calls",
        },
        {
            label: "Performance consolidada",
            description: hasCampaigns
                ? `${stats.emailsSent} email${stats.emailsSent !== 1 ? "s" : ""} enviado${stats.emailsSent !== 1 ? "s" : ""}.`
                : "Envie campanhas para enriquecer o relatório executivo.",
            done: hasOperationalData,
            reportType: "executive" as ReportType,
            action: "Gerar executivo",
            href: null,
        },
    ]
    const completedReadinessItems = readinessItems.filter((item) => item.done).length
    const readinessProgress = Math.round((completedReadinessItems / readinessItems.length) * 100)

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

            await downloadResponseBlob(response, createReportFileName(["relatorio", reportType], exportType))

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

    const handleReadinessAction = (item: (typeof readinessItems)[number]) => {
        if (item.href) {
            window.location.href = item.href
            return
        }

        handleExport(item.reportType, item.reportType === "executive" ? "pdf" : "pdf")
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
            <Card className={hasOperationalData ? "border-emerald-300 dark:border-emerald-900" : "border-amber-300 dark:border-amber-900"}>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <CardTitle>Prontidão dos relatórios</CardTitle>
                            <Badge variant={hasOperationalData ? "default" : "outline"}>
                                {completedReadinessItems}/{readinessItems.length} completo
                            </Badge>
                        </div>
                        <CardDescription>
                            Veja se este cliente já tem dados suficientes para relatórios operacionais e executivos.
                        </CardDescription>
                    </div>
                    <div className="w-full space-y-2 lg:w-64">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Cobertura</span>
                            <span className="font-medium">{readinessProgress}%</span>
                        </div>
                        <Progress value={readinessProgress} />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                    {readinessItems.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => handleReadinessAction(item)}
                            disabled={isExporting !== null}
                            className={cn(
                                "flex min-h-[116px] items-start justify-between gap-3 rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60",
                                item.done
                                    ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                                    : "border-amber-300 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
                            )}
                        >
                            <span className="flex min-w-0 gap-3">
                                {item.done ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                ) : (
                                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                )}
                                <span className="space-y-1">
                                    <span className="block font-medium leading-tight">{item.label}</span>
                                    <span className="block text-sm text-muted-foreground">{item.description}</span>
                                    <span className="block text-sm font-medium text-primary">{item.action}</span>
                                </span>
                            </span>
                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                    ))}
                </CardContent>
            </Card>

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
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ClipboardList className="h-4 w-4" />
                            Qual relatório usar?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            <strong>Executivo:</strong> melhor para prestação de contas, reunião com cliente
                            e leitura consolidada do mês.
                        </p>
                        <p>
                            <strong>Leads:</strong> melhor para revisar base, segmentar contatos e encontrar
                            oportunidades de qualificação.
                        </p>
                        <p>
                            <strong>Ligações:</strong> melhor para auditar follow-ups, callbacks e produtividade comercial.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
