// components/campaigns/sequence-steps-editor.tsx

"use client"

import { Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SequenceStepCard } from "./sequence-step-card"
import { SequencePresetSelector } from "./sequence-preset-selector"
import { MAX_SEQUENCE_STEPS, type SequenceStep } from "@/types/campaign.types"

interface SequenceStepsEditorProps {
    steps: SequenceStep[]
    templates: { id: string; name: string; subject: string; body: string }[]
    onChange: (steps: SequenceStep[]) => void
}

export function SequenceStepsEditor({
                                        steps,
                                        templates,
                                        onChange,
                                    }: SequenceStepsEditorProps) {
    const canAddStep = steps.length < MAX_SEQUENCE_STEPS

    const handleAddStep = () => {
        if (!canAddStep) return

        const newStep: SequenceStep = {
            id: crypto.randomUUID(),
            order: steps.length + 1,
            templateId: null,
            subject: "",
            content: "",
            delayDays: 3,
            delayHours: 0,
            condition: "not_opened",
        }

        onChange([...steps, newStep])
    }

    const handleUpdateStep = (stepId: string, updates: Partial<SequenceStep>) => {
        onChange(
            steps.map((step) =>
                step.id === stepId ? { ...step, ...updates } : step
            )
        )
    }

    const handleRemoveStep = (stepId: string) => {
        const filtered = steps.filter((step) => step.id !== stepId)
        // Reordenar
        const reordered = filtered.map((step, index) => ({
            ...step,
            order: index + 1,
        }))
        onChange(reordered)
    }

    const handlePresetSelect = (presetSteps: SequenceStep[]) => {
        onChange(presetSteps)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">Steps da Sequência</h3>
                    <p className="text-sm text-muted-foreground">
                        {steps.length} de {MAX_SEQUENCE_STEPS} steps configurados
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <SequencePresetSelector onSelect={handlePresetSelect} />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddStep}
                        disabled={!canAddStep}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Step
                    </Button>
                </div>
            </div>

            {steps.length === 0 ? (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Adicione pelo menos um step para criar a sequência, ou use um template pronto.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <SequenceStepCard
                            key={step.id}
                            step={step}
                            stepNumber={index + 1}
                            isFirst={index === 0}
                            templates={templates}
                            onUpdate={(updates) => handleUpdateStep(step.id, updates)}
                            onRemove={() => handleRemoveStep(step.id)}
                        />
                    ))}
                </div>
            )}

            {!canAddStep && (
                <p className="text-sm text-muted-foreground text-center">
                    Limite de {MAX_SEQUENCE_STEPS} steps atingido
                </p>
            )}
        </div>
    )
}