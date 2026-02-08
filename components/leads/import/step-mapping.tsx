// components/leads/import/step-mapping.tsx

"use client"

import { useState, useMemo } from "react"
import {
    ArrowRight,
    ArrowLeft,
    Check,
    AlertCircle,
    Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

import {
    MAPPABLE_FIELDS,
    autoMapColumn,
} from "@/lib/constants/csv-mapping.constants"

// ============================================================
// TIPOS
// ============================================================

interface StepMappingProps {
    headers: string[]
    sampleRows: Record<string, string>[]
    onComplete: (mapping: Record<string, string>) => void
    onBack: () => void
}

// ============================================================
// COMPONENTE
// ============================================================

export function StepMapping({
                                headers,
                                sampleRows,
                                onComplete,
                                onBack,
                            }: StepMappingProps) {
    // Auto-mapeamento inicial usando useMemo (não useEffect)
    const initialMapping = useMemo(() => {
        const autoMapping: Record<string, string> = {}

        headers.forEach(header => {
            const mappedField = autoMapColumn(header)
            if (mappedField) {
                autoMapping[header] = mappedField
            }
        })

        return autoMapping
    }, [headers])

    const [mapping, setMapping] = useState<Record<string, string>>(initialMapping)

    // Verifica se campos obrigatórios estão mapeados
    const requiredFields = MAPPABLE_FIELDS.filter(f => f.required)
    const mappedFields = Object.values(mapping)
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f.key))

    // Handler para mudar mapeamento
    const handleMappingChange = (header: string, value: string) => {
        setMapping(prev => {
            const newMapping = { ...prev }

            if (value === 'ignore') {
                delete newMapping[header]
            } else {
                // Remove mapeamento anterior do mesmo campo (evita duplicatas)
                Object.keys(newMapping).forEach(key => {
                    if (newMapping[key] === value && key !== header) {
                        delete newMapping[key]
                    }
                })
                newMapping[header] = value
            }

            return newMapping
        })
    }

    // Continuar
    const handleContinue = () => {
        if (missingRequired.length === 0) {
            onComplete(mapping)
        }
    }

    // Auto-mapear novamente
    const handleAutoMap = () => {
        const newMapping: Record<string, string> = {}

        headers.forEach(header => {
            const mappedField = autoMapColumn(header)
            if (mappedField) {
                newMapping[header] = mappedField
            }
        })

        setMapping(newMapping)
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>2. Mapeie as colunas</CardTitle>
                        <CardDescription>
                            Associe cada coluna do CSV a um campo do lead
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleAutoMap}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Auto-mapear
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Alerta de campos obrigatórios */}
                {missingRequired.length > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Campos obrigatórios não mapeados:{' '}
                            <strong>{missingRequired.map(f => f.label).join(', ')}</strong>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Tabela de mapeamento */}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Coluna do CSV</TableHead>
                                <TableHead className="w-[200px]">Exemplo</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="w-[250px]">Campo do Lead</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {headers.map((header) => {
                                const currentMapping = mapping[header]
                                const sampleValue = sampleRows[0]?.[header] || ''

                                return (
                                    <TableRow key={header}>
                                        {/* Coluna do CSV */}
                                        <TableCell className="font-mono text-sm">
                                            {header}
                                        </TableCell>

                                        {/* Exemplo */}
                                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                            {sampleValue || <span className="italic">(vazio)</span>}
                                        </TableCell>

                                        {/* Seta */}
                                        <TableCell>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </TableCell>

                                        {/* Select do campo */}
                                        <TableCell>
                                            <Select
                                                value={currentMapping || 'ignore'}
                                                onValueChange={(value) => handleMappingChange(header, value)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ignore">
                                                        <span className="text-muted-foreground">— Ignorar —</span>
                                                    </SelectItem>

                                                    {MAPPABLE_FIELDS.map((field) => {
                                                        const isUsed = Object.values(mapping).includes(field.key) &&
                                                            mapping[header] !== field.key

                                                        return (
                                                            <SelectItem
                                                                key={field.key}
                                                                value={field.key}
                                                                disabled={isUsed}
                                                            >
                                <span className="flex items-center gap-2">
                                  {field.label}
                                    {field.required && (
                                        <span className="text-red-500">*</span>
                                    )}
                                    {isUsed && (
                                        <span className="text-xs text-muted-foreground">(já usado)</span>
                                    )}
                                </span>
                                                            </SelectItem>
                                                        )
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            {currentMapping ? (
                                                <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Mapeado
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Ignorado
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Resumo */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="text-sm">
                        <span className="font-medium">{Object.keys(mapping).length}</span>
                        <span className="text-muted-foreground"> de {headers.length} colunas mapeadas</span>
                    </div>
                    <div className="flex gap-2">
                        {requiredFields.map(field => (
                            <Badge
                                key={field.key}
                                variant={mappedFields.includes(field.key) ? "default" : "destructive"}
                            >
                                {field.label}
                                {mappedFields.includes(field.key) && <Check className="h-3 w-3 ml-1" />}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Botões */}
                <div className="flex justify-between">
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                    <Button
                        onClick={handleContinue}
                        disabled={missingRequired.length > 0}
                    >
                        Continuar
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}