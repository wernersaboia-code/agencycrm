// components/campaigns/sequence-step-card.tsx
"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, GripVertical, Trash2, Clock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { cn } from "@/lib/utils"
import { STEP_CONDITIONS, type SequenceStep, type StepCondition } from "@/types/campaign.types"

interface SequenceStepCardProps {
    step: SequenceStep
    stepNumber: number
    isFirst: boolean
    templates: { id: string; name: string; subject: string; body: string }[]
    onUpdate: (updates: Partial<SequenceStep>) => void
    onRemove: () => void
}

export function SequenceStepCard({
                                     step,
                                     stepNumber,
                                     isFirst,
                                     templates,
                                     onUpdate,
                                     onRemove,
                                 }: SequenceStepCardProps) {
    const [isOpen, setIsOpen] = useState(true)

    const handleTemplateChange = (templateId: string) => {
        if (templateId === "none") {
            onUpdate({ templateId: null })
            return
        }

        const template = templates.find((t) => t.id === templateId)
        if (template) {
            onUpdate({
                templateId: template.id,
                subject: template.subject,
                content: template.body,
            })
        }
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="border rounded-lg bg-card">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />

                    <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {stepNumber}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">
                                {step.subject || `Step ${stepNumber}`}
                            </p>
                            {!isFirst && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {step.delayDays > 0 && `${step.delayDays} dia${step.delayDays > 1 ? "s" : ""}`}
                                    {step.delayDays > 0 && step.delayHours > 0 && " e "}
                                    {step.delayHours > 0 && `${step.delayHours} hora${step.delayHours > 1 ? "s" : ""}`}
                                    {step.delayDays === 0 && step.delayHours === 0 && "Imediatamente"}
                                    {" após o anterior"}
                                </p>
                            )}
                            {isFirst && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    Enviado imediatamente
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isFirst && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={onRemove}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        <CollapsibleTrigger asChild>
                            <Button type="button" variant="ghost" size="icon">
                                {isOpen ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </div>

                {/* Content */}
                <CollapsibleContent>
                    <div className="p-4 space-y-4">
                        {/* Delay e Condição (não mostra no primeiro step) */}
                        {!isFirst && (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Aguardar (dias)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={30}
                                        value={step.delayDays}
                                        onChange={(e) => onUpdate({ delayDays: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Aguardar (horas)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={23}
                                        value={step.delayHours}
                                        onChange={(e) => onUpdate({ delayHours: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Condição</Label>
                                    <Select
                                        value={step.condition}
                                        onValueChange={(value) => onUpdate({ condition: value as StepCondition })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STEP_CONDITIONS.map((condition) => (
                                                <SelectItem key={condition.value} value={condition.value}>
                                                    {condition.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Template */}
                        <div className="space-y-2">
                            <Label>Template (opcional)</Label>
                            <Select
                                value={step.templateId || "none"}
                                onValueChange={handleTemplateChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um template ou escreva do zero" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sem template</SelectItem>
                                    {templates.map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                            {template.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assunto */}
                        <div className="space-y-2">
                            <Label>Assunto *</Label>
                            <Input
                                value={step.subject}
                                onChange={(e) => onUpdate({ subject: e.target.value })}
                                placeholder="Ex: Acompanhamento - {{empresa}}"
                            />
                        </div>

                        {/* Conteúdo */}
                        <div className="space-y-2">
                            <Label>Conteúdo do email *</Label>
                            <RichTextEditor
                                content={step.content}
                                onChange={(content) => onUpdate({ content })}
                                placeholder="Escreva o conteúdo do email..."
                            />
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    )
}