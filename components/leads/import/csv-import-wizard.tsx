// components/leads/import/csv-import-wizard.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Upload,
    ArrowLeft,
    ArrowRight,
    Check,
    X,
    FileSpreadsheet,
    Columns,
    Eye,
    Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import { StepUpload } from "./step-upload"
import { StepMapping } from "./step-mapping"
import { StepPreview } from "./step-preview"
import { StepImporting } from "./step-importing"
import { useWorkspace } from "@/contexts/workspace-context"
import type { ParsedCSV, ProcessedLead } from "@/lib/csv-parser"

// ============================================================
// TIPOS
// ============================================================

type WizardStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

interface ImportState {
    file: File | null
    parsedCSV: ParsedCSV | null
    mapping: Record<string, string>
    processedLeads: {
        valid: ProcessedLead[]
        invalid: ProcessedLead[]
        total: number
    } | null
    importResult: {
        imported: number
        duplicates: number
        errors: number
    } | null
}

const STEPS: { key: WizardStep; label: string; icon: React.ElementType }[] = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'mapping', label: 'Mapeamento', icon: Columns },
    { key: 'preview', label: 'Revisão', icon: Eye },
    { key: 'importing', label: 'Importando', icon: Loader2 },
]

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function CSVImportWizard() {
    const router = useRouter()
    const { activeWorkspace } = useWorkspace()

    const [currentStep, setCurrentStep] = useState<WizardStep>('upload')
    const [state, setState] = useState<ImportState>({
        file: null,
        parsedCSV: null,
        mapping: {},
        processedLeads: null,
        importResult: null,
    })

    // Índice do step atual
    const currentStepIndex = STEPS.findIndex(s => s.key === currentStep)
    const progress = ((currentStepIndex + 1) / STEPS.length) * 100

    // Handlers
    const handleUploadComplete = (file: File, parsedCSV: ParsedCSV) => {
        setState(prev => ({ ...prev, file, parsedCSV }))
        setCurrentStep('mapping')
    }

    const handleMappingComplete = (mapping: Record<string, string>) => {
        setState(prev => ({ ...prev, mapping }))
        setCurrentStep('preview')
    }

    const handlePreviewComplete = (processedLeads: ImportState['processedLeads']) => {
        setState(prev => ({ ...prev, processedLeads }))
        setCurrentStep('importing')
    }

    const handleImportComplete = (result: ImportState['importResult']) => {
        setState(prev => ({ ...prev, importResult: result }))
        setCurrentStep('complete')
    }

    const handleBack = () => {
        const steps: WizardStep[] = ['upload', 'mapping', 'preview']
        const currentIndex = steps.indexOf(currentStep as any)
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1])
        }
    }

    const handleCancel = () => {
        router.push('/leads')
    }

    // Verifica workspace
    if (!activeWorkspace) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                        Selecione um cliente antes de importar leads.
                    </p>
                    <Button className="mt-4" onClick={() => router.push('/workspaces')}>
                        Gerenciar Clientes
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header com progresso */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5" />
                                Importar Leads via CSV
                            </CardTitle>
                            <CardDescription>
                                Importe leads de uma planilha Excel ou CSV
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleCancel}>
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Steps indicator */}
                    <div className="flex items-center justify-between mb-4">
                        {STEPS.map((step, index) => {
                            const Icon = step.icon
                            const isActive = step.key === currentStep
                            const isComplete = index < currentStepIndex
                            const isCurrent = index === currentStepIndex

                            return (
                                <div
                                    key={step.key}
                                    className={`flex items-center gap-2 ${
                                        isComplete ? 'text-green-600' :
                                            isCurrent ? 'text-primary' :
                                                'text-muted-foreground'
                                    }`}
                                >
                                    <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full
                    ${isComplete ? 'bg-green-100 dark:bg-green-900' :
                                        isCurrent ? 'bg-primary/10' :
                                            'bg-muted'}
                  `}>
                                        {isComplete ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Icon className={`h-4 w-4 ${isCurrent && step.key === 'importing' ? 'animate-spin' : ''}`} />
                                        )}
                                    </div>
                                    <span className={`text-sm font-medium hidden sm:inline ${
                                        isCurrent ? '' : 'hidden md:inline'
                                    }`}>
                    {step.label}
                  </span>
                                    {index < STEPS.length - 1 && (
                                        <div className={`w-8 md:w-16 h-0.5 mx-2 ${
                                            isComplete ? 'bg-green-600' : 'bg-muted'
                                        }`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <Progress value={progress} className="h-2" />
                </CardContent>
            </Card>

            {/* Conteúdo do step atual */}
            {currentStep === 'upload' && (
                <StepUpload onComplete={handleUploadComplete} />
            )}

            {currentStep === 'mapping' && state.parsedCSV && (
                <StepMapping
                    headers={state.parsedCSV.headers}
                    sampleRows={state.parsedCSV.rows.slice(0, 3)}
                    onComplete={handleMappingComplete}
                    onBack={handleBack}
                />
            )}

            {currentStep === 'preview' && state.parsedCSV && (
                <StepPreview
                    rows={state.parsedCSV.rows}
                    mapping={state.mapping}
                    onComplete={handlePreviewComplete}
                    onBack={handleBack}
                />
            )}

            {currentStep === 'importing' && state.processedLeads && (
                <StepImporting
                    workspaceId={activeWorkspace.id}
                    leads={state.processedLeads.valid}
                    onComplete={handleImportComplete}
                />
            )}

            {currentStep === 'complete' && state.importResult && (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                                <Check className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Importação Concluída!</h3>
                            <div className="flex justify-center gap-8 my-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">
                                        {state.importResult.imported}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Importados</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-600">
                                        {state.importResult.duplicates}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Duplicados</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-red-600">
                                        {state.importResult.errors}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Erros</div>
                                </div>
                            </div>
                            <Button onClick={() => router.push('/leads')}>
                                Ver Leads
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}