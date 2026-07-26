// components/admin/leads-upload-modal.tsx
"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import Papa from "papaparse"
import {
    Upload,
    FileSpreadsheet,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Download,
    X
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { uploadLeadsToList } from "@/actions/admin/lists"
import {
    MARKETPLACE_CSV_TEMPLATE_HEADERS,
    MARKETPLACE_CSV_TEMPLATE_EXAMPLE,
    autoMapMarketplaceColumn,
    validateMarketplaceLead,
    type MarketplaceLeadData,
} from "@/lib/constants/marketplace-csv.constants"

interface LeadsUploadModalProps {
    listId: string
    listName: string
    trigger?: React.ReactNode
}

type UploadStep = "select" | "preview" | "uploading" | "complete"

interface ParsedRow {
    original: Record<string, string>
    mapped: Partial<MarketplaceLeadData>
    valid: boolean
    errors: string[]
}

export function LeadsUploadModal({ listId, listName, trigger }: LeadsUploadModalProps) {
    const router = useRouter()
    const t = useTranslations("admin.components.leadsUpload")
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<UploadStep>("select")
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
    const [columnMapping, setColumnMapping] = useState<Record<string, string | null>>({})
    const [progress, setProgress] = useState(0)
    const [result, setResult] = useState<{ success: number; duplicates: number; errors: number } | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Reset quando fecha o modal
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            setTimeout(() => {
                setStep("select")
                setParsedRows([])
                setColumnMapping({})
                setProgress(0)
                setResult(null)
                setIsLoading(false)
            }, 200)
        }
    }

    // Download template CSV
    const handleDownloadTemplate = () => {
        const csvContent = [
            MARKETPLACE_CSV_TEMPLATE_HEADERS.join(","),
            MARKETPLACE_CSV_TEMPLATE_EXAMPLE.map(v => `"${v}"`).join(","),
        ].join("\n")

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "marketplace_leads_template.csv"
        link.click()
        URL.revokeObjectURL(url)

        toast.success(t("toastTemplateDownloaded"))
    }

    // Handle file selection
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (!selectedFile.name.endsWith(".csv")) {
            toast.error(t("toastSelectFile"))
            return
        }

        setIsLoading(true)

        // Parse CSV
        Papa.parse<Record<string, string>>(selectedFile, {
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8",
            complete: (results) => {
                // Auto-mapear colunas
                const headers = results.meta.fields || []
                const mapping: Record<string, string | null> = {}

                headers.forEach(header => {
                    mapping[header] = autoMapMarketplaceColumn(header)
                })

                setColumnMapping(mapping)

                // Processar cada linha
                const rows: ParsedRow[] = results.data.map((row) => {
                    const mapped: Partial<MarketplaceLeadData> = {}

                    // Aplicar mapeamento
                    for (const [csvColumn, value] of Object.entries(row)) {
                        const fieldKey = mapping[csvColumn]
                        if (fieldKey && value?.trim()) {
                            (mapped as Record<string, string>)[fieldKey] = value.trim()
                        }
                    }

                    // Validar
                    const validation = validateMarketplaceLead(mapped)

                    return {
                        original: row,
                        mapped,
                        valid: validation.valid,
                        errors: validation.errors,
                    }
                })

                setParsedRows(rows)
                setStep("preview")
                setIsLoading(false)
            },
            error: (error) => {
                toast.error(t("toastReadError", { message: error.message }))
                setIsLoading(false)
            },
        })
    }, [])

    // Handle upload
    const handleUpload = async () => {
        const validLeads = parsedRows
            .filter(row => row.valid)
            .map(row => row.mapped as MarketplaceLeadData)

        if (validLeads.length === 0) {
            toast.error(t("toastNoValid"))
            return
        }

        setStep("uploading")
        setProgress(10)

        try {
            // Simular progresso
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 15, 85))
            }, 300)

            const uploadResult = await uploadLeadsToList(listId, validLeads)

            clearInterval(progressInterval)
            setProgress(100)

            const invalidCount = parsedRows.filter(r => !r.valid).length

            setResult({
                success: uploadResult.count,
                duplicates: validLeads.length - uploadResult.count,
                errors: invalidCount,
            })
            setStep("complete")

            toast.success(t("toastSuccess", { count: uploadResult.count }))
        } catch (error) {
            console.error("Erro ao importar:", error)
            toast.error(t("toastError"))
            setStep("preview")
        }
    }

    const validCount = parsedRows.filter(r => r.valid).length
    const invalidCount = parsedRows.filter(r => !r.valid).length
    const mappedFieldsCount = Object.values(columnMapping).filter(Boolean).length
    const totalFieldsCount = Object.keys(columnMapping).length

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        {t("button")}
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {t("dialogTitle", { name: listName })}
                    </DialogTitle>
                    <DialogDescription>
                        {t("dialogDesc")}
                    </DialogDescription>
                </DialogHeader>

                {/* Step: Select File */}
                {step === "select" && (
                    <div className="space-y-6 py-4">
                        {/* Área de upload */}
                        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                            <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground mb-4">
                                {t("dropzone")}
                            </p>
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                disabled={isLoading}
                                className="hidden"
                                id="csv-upload"
                            />
                            <Label htmlFor="csv-upload" className="cursor-pointer">
                                <Button asChild disabled={isLoading}>
                  <span>
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t("processing")}
                        </>
                    ) : (
                        t("selectFile")
                    )}
                  </span>
                                </Button>
                            </Label>
                        </div>

                        {/* Template download */}
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div>
                                <p className="font-medium">{t("needTemplate")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {t("downloadTemplate")}
                                </p>
                            </div>
                            <Button variant="outline" onClick={handleDownloadTemplate}>
                                <Download className="mr-2 h-4 w-4" />
                                {t("downloadBtn")}
                            </Button>
                        </div>

                        {/* Campos obrigatórios */}
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="flex gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-amber-800 dark:text-amber-200">
                                        {t("requiredFields")}
                                    </p>
                                    <p className="text-amber-700 dark:text-amber-300">
                                        {t("requiredFieldsList")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step: Preview */}
                {step === "preview" && (
                    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        {/* Estatísticas */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="p-3 bg-muted rounded-lg text-center">
                                <p className="text-2xl font-bold">{parsedRows.length}</p>
                                <p className="text-xs text-muted-foreground">{t("total")}</p>
                            </div>
                            <div className="p-3 bg-admin-soft dark:bg-admin-soft/30 rounded-lg text-center">
                                <p className="text-2xl font-bold text-admin">{validCount}</p>
                                <p className="text-xs text-muted-foreground">{t("valid")}</p>
                            </div>
                            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-center">
                                <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
                                <p className="text-xs text-muted-foreground">{t("errors")}</p>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                    {mappedFieldsCount}/{totalFieldsCount}
                                </p>
                                <p className="text-xs text-muted-foreground">{t("mapped")}</p>
                            </div>
                        </div>

                        {/* Mapeamento de colunas */}
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium mb-2">{t("autoMapped")}</p>
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(columnMapping).map(([csv, field]) => (
                                    <Badge
                                        key={csv}
                                        variant={field ? "default" : "outline"}
                                        className="text-xs"
                                    >
                                        {csv} → {field || t("notMapped")}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Tabela de preview */}
                        <ScrollArea className="flex-1 border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">{t("colStatus")}</TableHead>
                                        <TableHead>{t("colCompany")}</TableHead>
                                        <TableHead>{t("colCountry")}</TableHead>
                                        <TableHead>{t("colEmail")}</TableHead>
                                        <TableHead>{t("colSector")}</TableHead>
                                        <TableHead>{t("colErrors")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedRows.slice(0, 50).map((row, index) => (
                                        <TableRow
                                            key={index}
                                            className={!row.valid ? "bg-red-50 dark:bg-red-950/20" : ""}
                                        >
                                            <TableCell>
                                                {row.valid ? (
                                                    <CheckCircle2 className="h-4 w-4 text-admin" />
                                                ) : (
                                                    <X className="h-4 w-4 text-red-600" />
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {row.mapped.companyName || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {row.mapped.country || "-"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {row.mapped.emailGeneral || "-"}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {row.mapped.sector || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {row.errors.length > 0 && (
                                                    <span className="text-xs text-red-600">
                            {row.errors.join(", ")}
                          </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>

                        {parsedRows.length > 50 && (
                            <p className="text-sm text-muted-foreground text-center">
                                {t("showing50", { count: parsedRows.length })}
                            </p>
                        )}

                        {/* Ações */}
                        <div className="flex justify-between pt-2">
                            <Button variant="outline" onClick={() => setStep("select")}>
                                {t("back")}
                            </Button>
                            <Button onClick={handleUpload} disabled={validCount === 0}>
                                <Upload className="h-4 w-4 mr-2" />
                                {t("importCount", { count: validCount })}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step: Uploading */}
                {step === "uploading" && (
                    <div className="py-12 space-y-6">
                        <div className="text-center">
                            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                            <p className="text-lg font-medium">{t("importing")}</p>
                            <p className="text-sm text-muted-foreground">
                                {t("pleaseWait")}
                            </p>
                        </div>
                        <Progress value={progress} className="w-full" />
                        <p className="text-center text-sm text-muted-foreground">
                            {t("progressPercent", { percent: progress })}
                        </p>
                    </div>
                )}

                {/* Step: Complete */}
                {step === "complete" && result && (
                    <div className="py-12 text-center space-y-6">
                        <CheckCircle2 className="mx-auto h-16 w-16 text-admin" />
                        <div>
                            <p className="text-2xl font-bold text-admin">
                                {t("resultTitle", { success: result.success })}
                            </p>
                            {result.duplicates > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {t("duplicatesIgnored", { count: result.duplicates })}
                                </p>
                            )}
                            {result.errors > 0 && (
                                <p className="text-sm text-red-600">
                                    {t("errorLines", { count: result.errors })}
                                </p>
                            )}
                        </div>
                        <Button
                            onClick={() => {
                                handleOpenChange(false)
                                router.refresh()
                            }}
                        >
                            {t("close")}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
