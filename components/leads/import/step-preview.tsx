// components/leads/import/step-preview.tsx

"use client"

import { useMemo } from "react"
import {
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import {
    processCSVForImport,
    type ProcessedLead
} from "@/lib/csv-parser"
import { MAPPABLE_FIELDS } from "@/lib/constants/csv-mapping.constants"

// ============================================================
// TIPOS
// ============================================================

interface StepPreviewProps {
    rows: Record<string, string>[]
    mapping: Record<string, string>
    onComplete: (processedLeads: {
        valid: ProcessedLead[]
        invalid: ProcessedLead[]
        total: number
    }) => void
    onBack: () => void
}

// ============================================================
// COMPONENTE
// ============================================================

export function StepPreview({
                                rows,
                                mapping,
                                onComplete,
                                onBack,
                            }: StepPreviewProps) {
    // Processa os leads
    const processedLeads = useMemo(() => {
        return processCSVForImport(rows, mapping)
    }, [rows, mapping])

    const { valid, invalid, total } = processedLeads

    // Campos mapeados para exibição
    const mappedFieldKeys = Object.values(mapping).filter(v => v !== 'ignore')
    const displayFields = MAPPABLE_FIELDS.filter(f => mappedFieldKeys.includes(f.key))

    // Continuar
    const handleContinue = () => {
        onComplete(processedLeads)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>3. Revise os dados</CardTitle>
                <CardDescription>
                    Verifique os leads antes de importar
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Estatísticas */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted text-center">
                        <div className="text-3xl font-bold">{total}</div>
                        <div className="text-sm text-muted-foreground">Total de linhas</div>
                    </div>
                    <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900 text-center">
                        <div className="text-3xl font-bold text-green-600">{valid.length}</div>
                        <div className="text-sm text-green-600/80">Válidos para importar</div>
                    </div>
                    <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900 text-center">
                        <div className="text-3xl font-bold text-red-600">{invalid.length}</div>
                        <div className="text-sm text-red-600/80">Com erros</div>
                    </div>
                </div>

                {/* Tabs de preview */}
                <Tabs defaultValue="valid">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="valid" className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Válidos ({valid.length})
                        </TabsTrigger>
                        <TabsTrigger value="invalid" className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Com erros ({invalid.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab Válidos */}
                    <TabsContent value="valid">
                        <ScrollArea className="h-[400px] border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px]">#</TableHead>
                                        {displayFields.slice(0, 5).map(field => (
                                            <TableHead key={field.key}>{field.label}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {valid.slice(0, 100).map((lead, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="text-muted-foreground">
                                                {lead.rowIndex}
                                            </TableCell>
                                            {displayFields.slice(0, 5).map(field => (
                                                <TableCell key={field.key} className="max-w-[200px] truncate">
                                                    {lead.data[field.key] || <span className="text-muted-foreground">—</span>}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {valid.length > 100 && (
                                <div className="p-4 text-center text-sm text-muted-foreground border-t">
                                    Mostrando 100 de {valid.length} leads válidos
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    {/* Tab Inválidos */}
                    <TabsContent value="invalid">
                        {invalid.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                                <h3 className="text-lg font-medium">Nenhum erro encontrado!</h3>
                                <p className="text-muted-foreground">
                                    Todos os leads estão válidos para importação.
                                </p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[400px] border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[60px]">Linha</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Erros</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invalid.map((lead, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="text-muted-foreground">
                                                    {lead.rowIndex}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {lead.data.email || <span className="text-red-500">(vazio)</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {lead.data.firstName || <span className="text-red-500">(vazio)</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {lead.errors.map((error, i) => (
                                                            <Badge key={i} variant="destructive" className="text-xs">
                                                                {error}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Aviso */}
                {invalid.length > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                {invalid.length} leads não serão importados
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Apenas os {valid.length} leads válidos serão importados.
                                Você pode corrigir o CSV e tentar novamente depois.
                            </p>
                        </div>
                    </div>
                )}

                {/* Botões */}
                <div className="flex justify-between">
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                    <Button
                        onClick={handleContinue}
                        disabled={valid.length === 0}
                    >
                        Importar {valid.length} leads
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}