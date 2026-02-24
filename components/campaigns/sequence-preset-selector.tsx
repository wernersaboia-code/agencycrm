// components/campaigns/sequence-preset-selector.tsx

"use client"

import { useState } from "react"
import { Check, ChevronDown, Sparkles, Mail, Briefcase, Code, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
    SEQUENCE_TEMPLATE_PRESETS,
    SEQUENCE_CATEGORIES,
    type SequenceTemplatePreset,
} from "@/lib/constants/sequence-templates.constants"
import type { SequenceStep } from "@/types/campaign.types"

interface SequencePresetSelectorProps {
    onSelect: (steps: SequenceStep[]) => void
}

const CATEGORY_ICONS = {
    generic: Target,
    marketing: Mail,
    consulting: Briefcase,
    saas: Code,
} as const

export function SequencePresetSelector({ onSelect }: SequencePresetSelectorProps) {
    const [open, setOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [expandedPreset, setExpandedPreset] = useState<string | null>(null)

    const handleSelectPreset = (preset: SequenceTemplatePreset) => {
        // Converter preset para SequenceStep[]
        const steps: SequenceStep[] = preset.steps.map((step, index) => ({
            id: crypto.randomUUID(),
            order: index + 1,
            templateId: null,
            subject: step.subject,
            content: step.content,
            delayDays: step.delayDays,
            delayHours: step.delayHours,
            condition: step.condition,
        }))

        onSelect(steps)
        setOpen(false)
    }

    const filteredPresets = selectedCategory
        ? SEQUENCE_TEMPLATE_PRESETS.filter((p) => p.category === selectedCategory)
        : SEQUENCE_TEMPLATE_PRESETS

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Usar template pronto
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        Templates de Sequência
                    </DialogTitle>
                    <DialogDescription>
                        Escolha um template pronto e personalize conforme sua necessidade.
                    </DialogDescription>
                </DialogHeader>

                {/* Filtro por Categoria */}
                <div className="flex flex-wrap gap-2 py-2">
                    <Button
                        type="button"
                        variant={selectedCategory === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                    >
                        Todos
                    </Button>
                    {SEQUENCE_CATEGORIES.map((cat) => {
                        const Icon = CATEGORY_ICONS[cat.value as keyof typeof CATEGORY_ICONS]
                        return (
                            <Button
                                key={cat.value}
                                type="button"
                                variant={selectedCategory === cat.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(cat.value)}
                            >
                                <Icon className="h-4 w-4 mr-1" />
                                {cat.label}
                            </Button>
                        )
                    })}
                </div>

                {/* Lista de Presets */}
                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-3">
                        {filteredPresets.map((preset) => {
                            const Icon = CATEGORY_ICONS[preset.category as keyof typeof CATEGORY_ICONS]
                            const isExpanded = expandedPreset === preset.id

                            return (
                                <Collapsible
                                    key={preset.id}
                                    open={isExpanded}
                                    onOpenChange={() =>
                                        setExpandedPreset(isExpanded ? null : preset.id)
                                    }
                                >
                                    <div className="border rounded-lg overflow-hidden">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 p-4 bg-card">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium">{preset.name}</h4>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {preset.steps.length} emails
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {preset.description}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CollapsibleTrigger asChild>
                                                    <Button type="button" variant="ghost" size="sm">
                                                        <ChevronDown
                                                            className={cn(
                                                                "h-4 w-4 transition-transform",
                                                                isExpanded && "rotate-180"
                                                            )}
                                                        />
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => handleSelectPreset(preset)}
                                                >
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Usar
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Steps Preview */}
                                        <CollapsibleContent>
                                            <div className="border-t bg-muted/30 p-4">
                                                <div className="space-y-3">
                                                    {preset.steps.map((step, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-start gap-3 p-3 bg-background rounded-lg"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm truncate">
                                                                    {step.subject}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {index === 0 ? (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Imediato
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            +{step.delayDays}d {step.delayHours > 0 && `${step.delayHours}h`}
                                                                        </Badge>
                                                                    )}
                                                                    {step.condition !== "always" && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            {step.condition === "not_opened" && "Se não abriu"}
                                                                            {step.condition === "opened" && "Se abriu"}
                                                                            {step.condition === "not_clicked" && "Se não clicou"}
                                                                            {step.condition === "clicked" && "Se clicou"}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-3">
                                                    💡 Você poderá editar todos os textos após selecionar.
                                                </p>
                                            </div>
                                        </CollapsibleContent>
                                    </div>
                                </Collapsible>
                            )
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}