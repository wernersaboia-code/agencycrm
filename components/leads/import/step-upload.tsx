// components/leads/import/step-upload.tsx

"use client"

import { useState, useCallback } from "react"
import {
    Upload,
    FileSpreadsheet,
    FileText,
    AlertCircle,
    CheckCircle2,
    X,
    Download,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

import {
    parseFile,
    generateExcelTemplate,
    generateCSVTemplate,
    type ParsedFile,
} from "@/lib/file-parser"

// ============================================================
// TIPOS
// ============================================================

interface StepUploadProps {
    onComplete: (file: File, parsedData: ParsedFile) => void
}

// ============================================================
// COMPONENTE
// ============================================================

export function StepUpload({ onComplete }: StepUploadProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<ParsedFile | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Processa o arquivo
    const processFile = useCallback(async (selectedFile: File) => {
        setError(null)
        setIsProcessing(true)

        try {
            const result = await parseFile(selectedFile)

            if (!result.success) {
                throw new Error(
                    result.error.message + (result.error.details ? `: ${result.error.details}` : '')
                )
            }

            if (result.data.rows.length === 0) {
                throw new Error('O arquivo está vazio ou não contém dados válidos.')
            }

            if (result.data.headers.length === 0) {
                throw new Error('Não foi possível identificar as colunas. Verifique se o arquivo tem cabeçalho.')
            }

            setFile(selectedFile)
            setParsedData(result.data)
            toast.success(`Arquivo carregado: ${result.data.totalRows} linhas encontradas`)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao processar arquivo'
            setError(message)
            toast.error(message)
            setFile(null)
            setParsedData(null)
        } finally {
            setIsProcessing(false)
        }
    }, [])

    // Handlers de drag & drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)

            const droppedFile = e.dataTransfer.files[0]
            if (droppedFile) {
                processFile(droppedFile)
            }
        },
        [processFile]
    )

    // Handler de input file
    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0]
            if (selectedFile) {
                processFile(selectedFile)
            }
        },
        [processFile]
    )

    // Remove arquivo
    const handleRemoveFile = () => {
        setFile(null)
        setParsedData(null)
        setError(null)
    }

    // Download templates
    const handleDownloadExcel = () => {
        const blob = generateExcelTemplate()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template-importacao-leads.xlsx'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Template Excel baixado!')
    }

    const handleDownloadCSV = () => {
        const csv = generateCSVTemplate()
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }) // BOM para Excel
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template-importacao-leads.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Template CSV baixado!')
    }

    // Continuar
    const handleContinue = () => {
        if (file && parsedData) {
            onComplete(file, parsedData)
        }
    }

    // Ícone do tipo de arquivo
    const getFileIcon = () => {
        if (!parsedData) return <FileSpreadsheet className="h-6 w-6 text-green-600" />
        if (parsedData.fileType === 'xlsx' || parsedData.fileType === 'xls') {
            return <FileSpreadsheet className="h-6 w-6 text-green-600" />
        }
        return <FileText className="h-6 w-6 text-blue-600" />
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>1. Selecione o arquivo</CardTitle>
                <CardDescription>
                    Faça upload de um arquivo CSV ou Excel com os leads para importar
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Área de Templates */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                        <p className="font-medium">📥 Baixar Template</p>
                        <p className="text-sm text-muted-foreground">
                            Use nosso modelo para garantir compatibilidade
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                            <FileText className="h-4 w-4 mr-2" />
                            CSV
                        </Button>
                    </div>
                </div>

                {/* Área de Drop */}
                {!file && (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
              relative border-2 border-dashed rounded-lg p-12
              transition-colors cursor-pointer
              ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${isProcessing ? 'pointer-events-none opacity-50' : ''}
            `}
                    >
                        <input
                            type="file"
                            accept=".csv,.txt,.xlsx,.xls"
                            onChange={handleFileInput}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isProcessing}
                        />

                        <div className="flex flex-col items-center text-center">
                            <div
                                className={`
                  w-16 h-16 rounded-full flex items-center justify-center mb-4
                  ${isDragging ? 'bg-primary/10' : 'bg-muted'}
                `}
                            >
                                {isProcessing ? (
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                ) : (
                                    <Upload className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                                )}
                            </div>

                            <p className="text-lg font-medium mb-1">
                                {isProcessing
                                    ? 'Processando arquivo...'
                                    : isDragging
                                        ? 'Solte o arquivo aqui'
                                        : 'Arraste seu arquivo aqui'}
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
                            <p className="text-xs text-muted-foreground">
                                Formatos aceitos: CSV, Excel (.xlsx, .xls), TXT • Máximo 10MB
                            </p>
                        </div>
                    </div>
                )}

                {/* Arquivo selecionado */}
                {file && parsedData && (
                    <div className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    {getFileIcon()}
                                </div>
                                <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(file.size / 1024).toFixed(1)} KB •{' '}
                                        {parsedData.fileType.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Estatísticas */}
                        <div className="mt-4 grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <div className="text-2xl font-bold">{parsedData.totalRows}</div>
                                <div className="text-xs text-muted-foreground">Linhas</div>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <div className="text-2xl font-bold">{parsedData.headers.length}</div>
                                <div className="text-xs text-muted-foreground">Colunas</div>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    <CheckCircle2 className="h-6 w-6 mx-auto" />
                                </div>
                                <div className="text-xs text-muted-foreground">Válido</div>
                            </div>
                        </div>

                        {/* Preview das colunas */}
                        <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Colunas encontradas:</p>
                            <div className="flex flex-wrap gap-2">
                                {parsedData.headers.map((header, i) => (
                                    <span key={i} className="px-2 py-1 bg-muted rounded text-xs font-mono">
                    {header}
                  </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Erro */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Dicas */}
                <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Dicas para o arquivo
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• A primeira linha deve conter os nomes das colunas</li>
                        <li>• Cada linha representa um lead</li>
                        <li>
                            • Campos obrigatórios: <strong>Nome</strong> e <strong>Email</strong>
                        </li>
                        <li>• Emails protegidos como email[@]dominio.com serão corrigidos automaticamente</li>
                        <li>• Para arquivos Excel, apenas a primeira planilha é importada</li>
                    </ul>
                </div>

                {/* Botão continuar */}
                {file && parsedData && (
                    <div className="flex justify-end">
                        <Button onClick={handleContinue} size="lg">
                            Continuar
                            <span className="ml-2">→</span>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}