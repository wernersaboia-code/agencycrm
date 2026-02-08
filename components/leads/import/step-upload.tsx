// components/leads/import/step-upload.tsx

"use client"

import { useState, useCallback } from "react"
import {
    Upload,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle2,
    File,
    X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { parseCSVFile, type ParsedCSV } from "@/lib/csv-parser"

// ============================================================
// TIPOS
// ============================================================

interface StepUploadProps {
    onComplete: (file: File, parsedCSV: ParsedCSV) => void
}

// ============================================================
// COMPONENTE
// ============================================================

export function StepUpload({ onComplete }: StepUploadProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Processa o arquivo
    const processFile = useCallback(async (selectedFile: File) => {
        setError(null)
        setIsProcessing(true)

        try {
            // Valida extensão
            const validExtensions = ['.csv', '.txt']
            const extension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'))

            if (!validExtensions.includes(extension)) {
                throw new Error('Formato inválido. Use arquivos .csv ou .txt')
            }

            // Valida tamanho (máx 10MB)
            const maxSize = 10 * 1024 * 1024
            if (selectedFile.size > maxSize) {
                throw new Error('Arquivo muito grande. Máximo 10MB.')
            }

            // Faz o parse
            const result = await parseCSVFile(selectedFile)

            // Valida se tem dados
            if (result.rows.length === 0) {
                throw new Error('O arquivo está vazio ou não contém dados válidos.')
            }

            if (result.headers.length === 0) {
                throw new Error('Não foi possível identificar as colunas. Verifique se o arquivo tem cabeçalho.')
            }

            setFile(selectedFile)
            setParsedCSV(result)
            toast.success(`Arquivo carregado: ${result.totalRows} linhas encontradas`)

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao processar arquivo'
            setError(message)
            toast.error(message)
            setFile(null)
            setParsedCSV(null)
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

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            processFile(droppedFile)
        }
    }, [processFile])

    // Handler de input file
    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            processFile(selectedFile)
        }
    }, [processFile])

    // Remove arquivo
    const handleRemoveFile = () => {
        setFile(null)
        setParsedCSV(null)
        setError(null)
    }

    // Continuar
    const handleContinue = () => {
        if (file && parsedCSV) {
            onComplete(file, parsedCSV)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>1. Selecione o arquivo</CardTitle>
                <CardDescription>
                    Faça upload de um arquivo CSV ou TXT com os leads para importar
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Área de Drop */}
                {!file && (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
              relative border-2 border-dashed rounded-lg p-12
              transition-colors cursor-pointer
              ${isDragging
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-primary/50'
                        }
              ${isProcessing ? 'pointer-events-none opacity-50' : ''}
            `}
                    >
                        <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileInput}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isProcessing}
                        />

                        <div className="flex flex-col items-center text-center">
                            <div className={`
                w-16 h-16 rounded-full flex items-center justify-center mb-4
                ${isDragging ? 'bg-primary/10' : 'bg-muted'}
              `}>
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
                                        : 'Arraste seu arquivo CSV aqui'
                                }
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                                ou clique para selecionar
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Formatos aceitos: CSV, TXT • Máximo 10MB
                            </p>
                        </div>
                    </div>
                )}

                {/* Arquivo selecionado */}
                {file && parsedCSV && (
                    <div className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                    <FileSpreadsheet className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRemoveFile}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Estatísticas */}
                        <div className="mt-4 grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <div className="text-2xl font-bold">{parsedCSV.totalRows}</div>
                                <div className="text-xs text-muted-foreground">Linhas</div>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <div className="text-2xl font-bold">{parsedCSV.headers.length}</div>
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
                                {parsedCSV.headers.map((header, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 bg-muted rounded text-xs font-mono"
                                    >
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
                        <li>• Campos obrigatórios: <strong>Nome</strong> e <strong>Email</strong></li>
                        <li>• Use vírgula (,) ou ponto-e-vírgula (;) como separador</li>
                        <li>• Encoding recomendado: UTF-8</li>
                    </ul>
                </div>

                {/* Botão continuar */}
                {file && parsedCSV && (
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