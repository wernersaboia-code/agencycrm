// components/campaigns/campaign-type-selector.tsx
"use client"

import { Mail, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface CampaignTypeSelectorProps {
    value: "single" | "sequence"
    onChange: (value: "single" | "sequence") => void
}

export function CampaignTypeSelector({ value, onChange }: CampaignTypeSelectorProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <button
                type="button"
                onClick={() => onChange("single")}
                className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all",
                    value === "single"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                )}
            >
                <div className={cn(
                    "p-3 rounded-full",
                    value === "single" ? "bg-primary/10" : "bg-muted"
                )}>
                    <Mail className={cn(
                        "h-6 w-6",
                        value === "single" ? "text-primary" : "text-muted-foreground"
                    )} />
                </div>
                <div className="text-center">
                    <p className={cn(
                        "font-medium",
                        value === "single" ? "text-primary" : "text-foreground"
                    )}>
                        Email Único
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Envio simples, uma única mensagem
                    </p>
                </div>
            </button>

            <button
                type="button"
                onClick={() => onChange("sequence")}
                className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all",
                    value === "sequence"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                )}
            >
                <div className={cn(
                    "p-3 rounded-full",
                    value === "sequence" ? "bg-primary/10" : "bg-muted"
                )}>
                    <RefreshCw className={cn(
                        "h-6 w-6",
                        value === "sequence" ? "text-primary" : "text-muted-foreground"
                    )} />
                </div>
                <div className="text-center">
                    <p className={cn(
                        "font-medium",
                        value === "sequence" ? "text-primary" : "text-foreground"
                    )}>
                        Sequência
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Múltiplos emails automáticos
                    </p>
                </div>
            </button>
        </div>
    )
}