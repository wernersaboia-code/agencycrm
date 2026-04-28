// components/admin/marketplace-import-wizard.tsx
"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    X,
    AlertCircle,
    Loader2,
    ChevronRight,
    ChevronLeft,
    FileText,
    Table as TableIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

import { uploadLeadsToList } from "@/actions/admin/lists"
import {
    MARKETPLACE_CSV_FIELDS,
    MARKETPLACE_CSV_TEMPLATE_HEADERS,
    MARKETPLACE_CSV_TEMPLATE_EXAMPLE,
    autoMapMarketplaceColumn,
    validateMarketplaceLead,
    type MarketplaceLeadData,
} from "@/lib/constants/marketplace-csv.constants"

// ============================================
// TIPOS
// ============================================

type WizardMode = "import" | "prepare"

interface MarketplaceImportWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode?: WizardMode
    listId?: string
    listName: string
    onSuccess?: (count: number) => void
    onLeadsPrepared?: (leads: MarketplaceLeadData[]) => void
}

type WizardStep = "upload" | "mapping" | "preview" | "importing"

interface ParsedFile {
    headers: string[]
    rows: Record<string, string>[]
    fileName: string
    fileType: "csv" | "excel"
}

interface ColumnMapping {
    [csvColumn: string]: string | null
}

interface ProcessedLead {
    original: Record<string, string>
    mapped: Partial<MarketplaceLeadData>
    valid: boolean
    errors: string[]
    isComplete: boolean
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function MarketplaceImportWizard({
                                            open,
                                            onOpenChange,
                                            mode = "import",
                                            listId,
                                            listName,
                                            onSuccess,
                                            onLeadsPrepared,
                                        }: MarketplaceImportWizardProps) {
    // Estado do wizard
    const [step, setStep] = useState<WizardStep>("upload")
    const [isLoading, setIsLoading] = useState(false)

    // Estado do arquivo
    const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null)

    // Estado do mapeamento
    const [mapping, setMapping] = useState<ColumnMapping>({})

    // Estado do preview
    const [processedLeads, setProcessedLeads] = useState<ProcessedLead[]>([])

    // Estado da importação
    const [importProgress, setImportProgress] = useState(0)
    const [importResult, setImportResult] = useState<{
        imported: number
        duplicates: number
        errors: number
    } | null>(null)

    // ============================================
    // RESET
    // ============================================

    const resetWizard = useCallback(() => {
        setStep("upload")
        setParsedFile(null)
        setMapping({})
        setProcessedLeads([])
        setImportProgress(0)
        setImportResult(null)
        setIsLoading(false)
    }, [])

    const handleClose = useCallback(() => {
        onOpenChange(false)
        setTimeout(resetWizard, 200)
    }, [onOpenChange, resetWizard])

    // ============================================
    // STEP 1: UPLOAD
    // ============================================

    const parseCSV = (file: File): Promise<ParsedFile> => {
        return new Promise((resolve, reject) => {
            Papa.parse<Record<string, string>>(file, {
                header: true,
                skipEmptyLines: true,
                encoding: "UTF-8",
                complete: (results) => {
                    resolve({
                        headers: results.meta.fields || [],
                        rows: results.data,
                        fileName: file.name,
                        fileType: "csv",
                    })
                },
                error: (error) => reject(error),
            })
        })
    }

    const parseExcel = (file: File): Promise<ParsedFile> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = e.target?.result
                    const workbook = XLSX.read(data, { type: "array" })
                    const firstSheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[firstSheetName]
                    const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
                        defval: "",
                    })

                    const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : []

                    resolve({
                        headers,
                        rows: jsonData,
                        fileName: file.name,
                        fileType: "excel",
                    })
                } catch (error) {
                    reject(error)
                }
            }
            reader.onerror = reject
            reader.readAsArrayBuffer(file)
        })
    }

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const fileName = file.name.toLowerCase()
        const isCSV = fileName.endsWith(".csv")
        const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls")

        if (!isCSV && !isExcel) {
            toast.error("Formato não suportado. Use CSV ou Excel (.xlsx, .xls)")
            return
        }

        setIsLoading(true)

        try {
            const parsed = isCSV ? await parseCSV(file) : await parseExcel(file)

            if (parsed.rows.length === 0) {
                toast.error("O arquivo está vazio")
                setIsLoading(false)
                return
            }

            setParsedFile(parsed)

            // Auto-mapear colunas
            const autoMapping: ColumnMapping = {}
            parsed.headers.forEach((header) => {
                autoMapping[header] = autoMapMarketplaceColumn(header)
            })
            setMapping(autoMapping)

            setStep("mapping")
            toast.success(`${parsed.rows.length} linhas encontradas!`)
        } catch (error) {
            console.error("Erro ao ler arquivo:", error)
            toast.error("Erro ao ler o arquivo")
        } finally {
            setIsLoading(false)
        }
    }, [])

    const handleDownloadTemplate = (type: "csv" | "excel") => {
        if (type === "csv") {
            const csvContent = [
                MARKETPLACE_CSV_TEMPLATE_HEADERS.join(","),
                MARKETPLACE_CSV_TEMPLATE_EXAMPLE.map((v) => `"${v}"`).join(","),
            ].join("\n")

            const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = "marketplace_leads_template.csv"
            link.click()
            URL.revokeObjectURL(url)
        } else {
            const ws = XLSX.utils.aoa_to_sheet([
                MARKETPLACE_CSV_TEMPLATE_HEADERS,
                MARKETPLACE_CSV_TEMPLATE_EXAMPLE,
            ])
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Leads")
            XLSX.writeFile(wb, "marketplace_leads_template.xlsx")
        }

        toast.success(`Template ${type.toUpperCase()} baixado!`)
    }

    // ============================================
    // STEP 2: MAPEAMENTO
    // ============================================

    const handleMappingChange = (csvColumn: string, fieldKey: string | null) => {
        setMapping((prev) => ({
            ...prev,
            [csvColumn]: fieldKey === "none" ? null : fieldKey,
        }))
    }

    const getMappingStats = () => {
        const mapped = Object.values(mapping).filter(Boolean).length
        const total = Object.keys(mapping).length
        // Apenas country e companyName são obrigatórios agora
        const requiredFields = ["country", "companyName"]
        const mappedRequired = requiredFields.filter((f) =>
            Object.values(mapping).includes(f)
        ).length

        return { mapped, total, requiredFields: requiredFields.length, mappedRequired }
    }

    const canProceedFromMapping = () => {
        // Apenas country e companyName são obrigatórios
        const requiredFields = ["country", "companyName"]
        return requiredFields.every((f) => Object.values(mapping).includes(f))
    }

    const handleProceedToPreview = () => {
        if (!parsedFile) return

        const processed: ProcessedLead[] = parsedFile.rows.map((row) => {
            const mapped: Partial<MarketplaceLeadData> = {}

            for (const [csvColumn, fieldKey] of Object.entries(mapping)) {
                if (fieldKey && row[csvColumn]?.trim()) {
                    (mapped as Record<string, string>)[fieldKey] = row[csvColumn].trim()
                }
            }

            const validation = validateMarketplaceLead(mapped)

            return {
                original: row,
                mapped,
                valid: validation.valid,
                errors: validation.errors,
                isComplete: validation.isComplete,
            }
        })

        setProcessedLeads(processed)
        setStep("preview")
    }

    // ============================================
    // STEP 3: PREVIEW STATS
    // ============================================

    const getPreviewStats = () => {
        const valid = processedLeads.filter((l) => l.valid).length
        const invalid = processedLeads.filter((l) => !l.valid).length
        const complete = processedLeads.filter((l) => l.valid && l.isComplete).length
        const incomplete = processedLeads.filter((l) => l.valid && !l.isComplete).length
        return { valid, invalid, total: processedLeads.length, complete, incomplete }
    }

    // ============================================
    // STEP 4: CONFIRMAR / IMPORTAR
    // ============================================

    const handleConfirm = async () => {
        const validLeads = processedLeads
            .filter((l) => l.valid)
            .map((l) => l.mapped as MarketplaceLeadData)

        if (validLeads.length === 0) {
            toast.error("Nenhum lead válido para importar")
            return
        }

        // MODO PREPARE: Retorna os leads para o componente pai
        if (mode === "prepare") {
            onLeadsPrepared?.(validLeads)
            toast.success(`${validLeads.length} leads prontos para importar!`)
            handleClose()
            return
        }

        // MODO IMPORT: Envia direto pro banco
        if (!listId) {
            toast.error("ID da lista não encontrado")
            return
        }

        setStep("importing")
        setImportProgress(10)

        try {
            const progressInterval = setInterval(() => {
                setImportProgress((prev) => Math.min(prev + 10, 85))
            }, 200)

            const result = await uploadLeadsToList(listId, validLeads)

            clearInterval(progressInterval)
            setImportProgress(100)

            const invalidCount = processedLeads.filter((l) => !l.valid).length

            setImportResult({
                imported: result.count,
                duplicates: validLeads.length - result.count,
                errors: invalidCount,
            })

            toast.success(`${result.count} leads importados com sucesso!`)
            onSuccess?.(result.count)
        } catch (error) {
            console.error("Erro ao importar:", error)
            toast.error("Erro ao importar leads")
            setStep("preview")
        }
    }

    // ============================================
    // RENDER
    // ============================================

    const mappingStats = getMappingStats()
    const previewStats = getPreviewStats()
    const isPrepareMode = mode === "prepare"

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>
                        {isPrepareMode
                            ? `Preparar Leads para "${listName}"`
                            : `Importar Leads para "${listName}"`}
                    </DialogTitle>
                    <DialogDescription>
                        {isPrepareMode
                            ? "Selecione e mapeie os dados do arquivo. Os leads serão importados quando você criar a lista."
                            : "Importe leads de um arquivo CSV ou Excel"}
                    </DialogDescription>
                </DialogHeader>

                {/* Steps indicator */}
                <div className="px-6 py-3 border-b bg-muted/30">
                    <div className="flex items-center gap-2 text-sm">
                        <StepIndicator
                            step={1}
                            label="Upload"
                            active={step === "upload"}
                            completed={step !== "upload"}
                        />
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <StepIndicator
                            step={2}
                            label="Mapeamento"
                            active={step === "mapping"}
                            completed={step === "preview" || step === "importing"}
                        />
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <StepIndicator
                            step={3}
                            label="Preview"
                            active={step === "preview"}
                            completed={step === "importing"}
                        />
                        {!isPrepareMode && (
                            <>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                <StepIndicator
                                    step={4}
                                    label="Importação"
                                    active={step === "importing"}
                                    completed={importResult !== null}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* STEP 1: UPLOAD */}
                    {step === "upload" && (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                                <FileSpreadsheet className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">
                                    Arraste um arquivo ou clique para selecionar
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Formatos aceitos: CSV, Excel (.xlsx, .xls)
                                </p>
                                <Input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileSelect}
                                    disabled={isLoading}
                                    className="hidden"
                                    id="wizard-file-upload"
                                />
                                <Label htmlFor="wizard-file-upload" className="cursor-pointer">
                                    <Button type="button" asChild disabled={isLoading} size="lg">
                    <span>
                      {isLoading ? (
                          <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processando...
                          </>
                      ) : (
                          <>
                              <Upload className="h-4 w-4 mr-2" />
                              Selecionar Arquivo
                          </>
                      )}
                    </span>
                                    </Button>
                                </Label>
                            </div>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium">Precisa de um modelo?</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Baixe o template com todas as colunas
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownloadTemplate("csv")}
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                CSV
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownloadTemplate("excel")}
                                            >
                                                <TableIcon className="h-4 w-4 mr-2" />
                                                Excel
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                                <div className="flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-amber-800 dark:text-amber-200">
                                            Campos obrigatórios
                                        </p>
                                        <p className="text-sm text-amber-700 dark:text-amber-300">
                                            Country, Company Name (email é opcional)
                                        </p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                            Leads sem email serão marcados como &quot;incompletos&quot;
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: MAPEAMENTO */}
                    {step === "mapping" && parsedFile && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
                                    <div>
                                        <p className="font-medium">{parsedFile.fileName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {parsedFile.rows.length} linhas • {parsedFile.headers.length} colunas •{" "}
                                            {parsedFile.fileType.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant={
                                        mappingStats.mappedRequired === mappingStats.requiredFields
                                            ? "default"
                                            : "destructive"
                                    }
                                >
                                    {mappingStats.mappedRequired}/{mappingStats.requiredFields} obrigatórios
                                </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-muted rounded-lg text-center">
                                    <p className="text-2xl font-bold">{parsedFile.headers.length}</p>
                                    <p className="text-sm text-muted-foreground">Colunas</p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-green-600">{mappingStats.mapped}</p>
                                    <p className="text-sm text-muted-foreground">Mapeadas</p>
                                </div>
                                <div className="p-4 bg-muted rounded-lg text-center">
                                    <p className="text-2xl font-bold">{mappingStats.total - mappingStats.mapped}</p>
                                    <p className="text-sm text-muted-foreground">Ignoradas</p>
                                </div>
                            </div>

                            <div className="border rounded-lg">
                                <ScrollArea className="h-[300px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-1/3">Coluna do Arquivo</TableHead>
                                                <TableHead className="w-1/3">Mapear para</TableHead>
                                                <TableHead className="w-1/3">Exemplo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {parsedFile.headers.map((header) => {
                                                const currentMapping = mapping[header]
                                                const sampleValue = parsedFile.rows[0]?.[header] || ""
                                                const isRequired = ["country", "companyName"].includes(currentMapping || "")
                                                const isRecommended = currentMapping === "emailGeneral"

                                                return (
                                                    <TableRow key={header}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <code className="text-sm bg-muted px-2 py-1 rounded">{header}</code>
                                                                {isRequired && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        Obrigatório
                                                                    </Badge>
                                                                )}
                                                                {isRecommended && (
                                                                    <Badge variant="outline" className="text-xs text-amber-600">
                                                                        Recomendado
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select
                                                                value={currentMapping || "none"}
                                                                onValueChange={(value) => handleMappingChange(header, value)}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecionar campo" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">
                                                                        <span className="text-muted-foreground">— Ignorar —</span>
                                                                    </SelectItem>
                                                                    {MARKETPLACE_CSV_FIELDS.map((field) => (
                                                                        <SelectItem key={field.key} value={field.key}>
                                      <span className="flex items-center gap-2">
                                        {field.label}
                                          {field.required && (
                                              <Badge variant="outline" className="text-xs">
                                                  *
                                              </Badge>
                                          )}
                                      </span>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                              <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
                                {sampleValue || "—"}
                              </span>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>

                            {!canProceedFromMapping() && (
                                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                                    <div className="flex gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-red-800 dark:text-red-200">
                                                Campos obrigatórios faltando
                                            </p>
                                            <p className="text-sm text-red-700 dark:text-red-300">
                                                Mapeie os campos: Country e Company Name
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: PREVIEW */}
                    {step === "preview" && (
                        <div className="space-y-6">
                            {/* Estatísticas */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-4 bg-muted rounded-lg text-center">
                                    <p className="text-3xl font-bold">{previewStats.total}</p>
                                    <p className="text-sm text-muted-foreground">Total</p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                                    <p className="text-3xl font-bold text-green-600">{previewStats.complete}</p>
                                    <p className="text-sm text-muted-foreground">Completos</p>
                                </div>
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
                                    <p className="text-3xl font-bold text-amber-600">{previewStats.incomplete}</p>
                                    <p className="text-sm text-muted-foreground">Sem Email</p>
                                </div>
                                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg text-center">
                                    <p className="text-3xl font-bold text-red-600">{previewStats.invalid}</p>
                                    <p className="text-sm text-muted-foreground">Com Erros</p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <Tabs defaultValue="complete" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="complete" className="gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        Completos ({previewStats.complete})
                                    </TabsTrigger>
                                    <TabsTrigger value="incomplete" className="gap-2">
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                        Sem Email ({previewStats.incomplete})
                                    </TabsTrigger>
                                    <TabsTrigger value="invalid" className="gap-2">
                                        <X className="h-4 w-4 text-red-600" />
                                        Erros ({previewStats.invalid})
                                    </TabsTrigger>
                                </TabsList>

                                {/* Tab: Completos */}
                                <TabsContent value="complete" className="mt-4">
                                    {previewStats.complete === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-600" />
                                            <p>Nenhum lead completo (com email)</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[250px] border rounded-lg">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Empresa</TableHead>
                                                        <TableHead>País</TableHead>
                                                        <TableHead>Email</TableHead>
                                                        <TableHead>Setor</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {processedLeads
                                                        .filter((l) => l.valid && l.isComplete)
                                                        .slice(0, 50)
                                                        .map((lead, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell className="font-medium">
                                                                    {lead.mapped.companyName}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline">{lead.mapped.country}</Badge>
                                                                </TableCell>
                                                                <TableCell className="text-sm">
                                                                    {lead.mapped.emailGeneral}
                                                                </TableCell>
                                                                <TableCell className="text-sm text-muted-foreground">
                                                                    {lead.mapped.sector || "—"}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    )}
                                </TabsContent>

                                {/* Tab: Sem Email */}
                                <TabsContent value="incomplete" className="mt-4">
                                    {previewStats.incomplete === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                                            <p>Todos os leads têm email! 🎉</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[250px] border rounded-lg">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Empresa</TableHead>
                                                        <TableHead>País</TableHead>
                                                        <TableHead>Telefone</TableHead>
                                                        <TableHead>Website</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {processedLeads
                                                        .filter((l) => l.valid && !l.isComplete)
                                                        .slice(0, 50)
                                                        .map((lead, index) => (
                                                            <TableRow key={index} className="bg-amber-50 dark:bg-amber-950/20">
                                                                <TableCell className="font-medium">
                                                                    {lead.mapped.companyName}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline">{lead.mapped.country}</Badge>
                                                                </TableCell>
                                                                <TableCell className="text-sm">
                                                                    {lead.mapped.phoneGeneral || "—"}
                                                                </TableCell>
                                                                <TableCell className="text-sm text-muted-foreground">
                                                                    {lead.mapped.website || "—"}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    )}
                                </TabsContent>

                                {/* Tab: Erros */}
                                <TabsContent value="invalid" className="mt-4">
                                    {previewStats.invalid === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                                            <p>Nenhum erro encontrado! 🎉</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[250px] border rounded-lg">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Linha</TableHead>
                                                        <TableHead>Dados</TableHead>
                                                        <TableHead>Erros</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {processedLeads
                                                        .map((lead, index) => ({ lead, index }))
                                                        .filter(({ lead }) => !lead.valid)
                                                        .slice(0, 50)
                                                        .map(({ lead, index }) => (
                                                            <TableRow key={index} className="bg-red-50 dark:bg-red-950/20">
                                                                <TableCell className="font-mono text-sm">#{index + 1}</TableCell>
                                                                <TableCell>
                                  <span className="text-sm">
                                    {lead.mapped.companyName || lead.mapped.emailGeneral || "—"}
                                  </span>
                                                                </TableCell>
                                                                <TableCell>
                                  <span className="text-sm text-red-600">
                                    {lead.errors.join(", ")}
                                  </span>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    )}
                                </TabsContent>
                            </Tabs>

                            {/* Avisos */}
                            {previewStats.incomplete > 0 && (
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <div className="flex gap-3">
                                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-amber-800 dark:text-amber-200">
                                                {previewStats.incomplete} leads sem email
                                            </p>
                                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                                Serão importados como &quot;incompletos&quot;. Você pode adicionar os emails
                                                depois.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewStats.invalid > 0 && (
                                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                                    <div className="flex gap-3">
                                        <X className="h-5 w-5 text-red-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-red-800 dark:text-red-200">
                                                {previewStats.invalid} linhas com erros serão ignoradas
                                            </p>
                                            <p className="text-sm text-red-700 dark:text-red-300">
                                                Faltam campos obrigatórios (Country ou Company Name)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: IMPORTAÇÃO */}
                    {step === "importing" && (
                        <div className="py-12 space-y-8">
                            {importResult === null ? (
                                <div className="text-center space-y-6">
                                    <Loader2 className="mx-auto h-16 w-16 animate-spin text-emerald-600" />
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">Importando leads...</h3>
                                        <p className="text-muted-foreground">
                                            Aguarde enquanto processamos os dados
                                        </p>
                                    </div>
                                    <Progress value={importProgress} className="w-full max-w-md mx-auto" />
                                    <p className="text-sm text-muted-foreground">{importProgress}% concluído</p>
                                </div>
                            ) : (
                                <div className="text-center space-y-6">
                                    <CheckCircle2 className="mx-auto h-20 w-20 text-green-600" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-green-600 mb-2">
                                            {importResult.imported} leads importados!
                                        </h3>
                                        {importResult.duplicates > 0 && (
                                            <p className="text-muted-foreground">
                                                {importResult.duplicates} duplicados ignorados
                                            </p>
                                        )}
                                        {importResult.errors > 0 && (
                                            <p className="text-red-600">{importResult.errors} linhas com erros</p>
                                        )}
                                    </div>
                                    <Button size="lg" onClick={handleClose}>
                                        Fechar
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step !== "importing" && (
                    <div className="px-6 py-4 border-t bg-muted/30 flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                if (step === "upload") {
                                    handleClose()
                                } else if (step === "mapping") {
                                    setStep("upload")
                                } else if (step === "preview") {
                                    setStep("mapping")
                                }
                            }}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            {step === "upload" ? "Cancelar" : "Voltar"}
                        </Button>

                        {step === "mapping" && (
                            <Button
                                type="button"
                                onClick={handleProceedToPreview}
                                disabled={!canProceedFromMapping()}
                            >
                                Próximo
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}

                        {step === "preview" && (
                            <Button
                                type="button"
                                onClick={handleConfirm}
                                disabled={previewStats.valid === 0}
                            >
                                {isPrepareMode ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Confirmar {previewStats.valid} Leads
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Importar {previewStats.valid} Leads
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

// ============================================
// COMPONENTE AUXILIAR
// ============================================

function StepIndicator({
                           step,
                           label,
                           active,
                           completed,
                       }: {
    step: number
    label: string
    active: boolean
    completed: boolean
}) {
    return (
        <div className="flex items-center gap-2">
            <div
                className={`
          flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
          ${active ? "bg-emerald-600 text-white" : ""}
          ${completed && !active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : ""}
          ${!active && !completed ? "bg-muted text-muted-foreground" : ""}
        `}
            >
                {completed && !active ? <CheckCircle2 className="h-4 w-4" /> : step}
            </div>
            <span className={`text-sm ${active ? "font-medium" : "text-muted-foreground"}`}>
        {label}
      </span>
        </div>
    )
}
