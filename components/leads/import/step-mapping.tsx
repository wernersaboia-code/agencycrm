// components/leads/import/step-mapping.tsx

"use client"

import { useState, useMemo } from "react"
import {
    ArrowRight,
    ArrowLeft,
    Check,
    AlertCircle,
    Sparkles,
    Plus,
    Info,
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

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

// Campos que podem ter múltiplas colunas mapeadas
const MULTI_VALUE_FIELDS = ['notes']

// Campos que usam a primeira coluna encontrada (não duplica)
const SINGLE_VALUE_FIELDS = ['email', 'phone', 'mobile', 'firstName', 'lastName']

// ============================================================
// COMPONENTE
// ============================================================

export function StepMapping({
                                headers,
                                sampleRows,
                                onComplete,
                                onBack,
                            }: StepMappingProps) {
    // Analisa quais colunas têm dados
    const columnStats = useMemo(() => {
        const stats: Record<string, { filled: number; total: number; sample: string }> = {}

        headers.forEach(header => {
            let filled = 0
            let sample = ''

            sampleRows.forEach(row => {
                const value = row[header]?.trim()
                if (value) {
                    filled++
                    if (!sample) sample = value
                }
            })

            stats[header] = {
                filled,
                total: sampleRows.length,
                sample,
            }
        })

        return stats
    }, [headers, sampleRows])

    // Auto-mapeamento inicial
    const initialMapping = useMemo(() => {
        const autoMapping: Record<string, string> = {}
        const usedFields: Set<string> = new Set()

        // Primeiro, mapeia colunas com dados
        headers.forEach(header => {
            const stats = columnStats[header]

            // Só mapeia se a coluna tiver pelo menos 1 valor
            if (stats.filled > 0) {
                const mappedField = autoMapColumn(header)

                if (mappedField) {
                    // Para campos que só aceitam uma coluna, usa apenas a primeira
                    if (SINGLE_VALUE_FIELDS.includes(mappedField)) {
                        if (!usedFields.has(mappedField)) {
                            autoMapping[header] = mappedField
                            usedFields.add(mappedField)
                        }
                    } else {
                        // Para outros campos, pode duplicar ou adicionar às notas
                        autoMapping[header] = mappedField
                    }
                }
            }
        })

        return autoMapping
    }, [headers, columnStats])

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
                // Para campos single-value, remove mapeamento anterior
                if (SINGLE_VALUE_FIELDS.includes(value)) {
                    Object.keys(newMapping).forEach(key => {
                        if (newMapping[key] === value && key !== header) {
                            delete newMapping[key]
                        }
                    })
                }
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
        const usedFields: Set<string> = new Set()

        headers.forEach(header => {
            const stats = columnStats[header]

            if (stats.filled > 0) {
                const mappedField = autoMapColumn(header)

                if (mappedField) {
                    if (SINGLE_VALUE_FIELDS.includes(mappedField)) {
                        if (!usedFields.has(mappedField)) {
                            newMapping[header] = mappedField
                            usedFields.add(mappedField)
                        }
                    } else {
                        newMapping[header] = mappedField
                    }
                }
            }
        })

        setMapping(newMapping)
    }

    // Conta quantas colunas mapeiam para cada campo
    const fieldUsageCount = useMemo(() => {
        const counts: Record<string, number> = {}
        Object.values(mapping).forEach(field => {
            counts[field] = (counts[field] || 0) + 1
        })
        return counts
    }, [mapping])

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>2. Mapeie as colunas</CardTitle>
                        <CardDescription>
                            Associe cada coluna do arquivo a um campo do lead
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

                {/* Dica sobre colunas vazias */}
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Colunas sem dados são automaticamente ignoradas. Você pode mapeá-las manualmente se desejar.
                    </AlertDescription>
                </Alert>

                {/* Tabela de mapeamento */}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Coluna do Arquivo</TableHead>
                                <TableHead className="w-[120px]">Preenchimento</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="w-[250px]">Campo do Lead</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {headers.map((header) => {
                                const currentMapping = mapping[header]
                                const stats = columnStats[header]
                                const fillPercentage = stats.total > 0
                                    ? Math.round((stats.filled / stats.total) * 100)
                                    : 0
                                const isEmpty = stats.filled === 0

                                return (
                                    <TableRow key={header} className={isEmpty ? 'opacity-50' : ''}>
                                        {/* Coluna do arquivo */}
                                        <TableCell className="font-mono text-sm">
                                            <div className="flex flex-col">
                                                <span>{header}</span>
                                                {stats.sample && (
                                                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                            ex: {stats.sample}
                          </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Preenchimento */}
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Badge
                                                            variant={isEmpty ? "secondary" : fillPercentage === 100 ? "default" : "outline"}
                                                            className={isEmpty ? 'bg-muted' : ''}
                                                        >
                                                            {stats.filled}/{stats.total} ({fillPercentage}%)
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {isEmpty
                                                            ? 'Coluna vazia - será ignorada por padrão'
                                                            : `${stats.filled} de ${stats.total} linhas preenchidas`
                                                        }
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
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
                                                        const isSingleValue = SINGLE_VALUE_FIELDS.includes(field.key)

                                                        return (
                                                            <SelectItem
                                                                key={field.key}
                                                                value={field.key}
                                                                disabled={isUsed && isSingleValue}
                                                            >
                                <span className="flex items-center gap-2">
                                  {field.label}
                                    {field.required && (
                                        <span className="text-red-500">*</span>
                                    )}
                                    {isUsed && isSingleValue && (
                                        <span className="text-xs text-muted-foreground">(já usado)</span>
                                    )}
                                    {isUsed && !isSingleValue && (
                                        <Plus className="h-3 w-3 text-muted-foreground" />
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
                                            ) : isEmpty ? (
                                                <Badge variant="secondary" className="bg-muted">
                                                    Vazia
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
                        <span className="text-muted-foreground ml-2">
              ({headers.filter(h => columnStats[h].filled === 0).length} vazias)
            </span>
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