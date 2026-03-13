// components/calls/ClickToCallButton.tsx

"use client"

// ============================================
// IMPORTS
// ============================================
import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useActiveCall, ActiveCallLead } from "@/contexts/active-call-context"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface ClickToCallButtonProps {
    /** Dados do lead */
    lead: ActiveCallLead
    /** Variante do botão */
    variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link"
    /** Tamanho */
    size?: "default" | "sm" | "lg" | "icon"
    /** Mostrar texto? */
    showLabel?: boolean
    /** Classes adicionais */
    className?: string
    /** Desabilitado? */
    disabled?: boolean
}

// ============================================
// COMPONENT
// ============================================

export function ClickToCallButton({
                                      lead,
                                      variant = "outline",
                                      size = "sm",
                                      showLabel = true,
                                      className,
                                      disabled = false,
                                  }: ClickToCallButtonProps) {
    const { startCall, hasActiveCall } = useActiveCall()

    // ============================================
    // HANDLERS
    // ============================================

    const handleClick = (): void => {
        console.log("🔴 Botão clicado!", { lead, hasActiveCall })
        if (!lead.phone) {
            console.log("❌ Lead sem telefone")
            return
        }
        console.log("✅ Chamando startCall...")
        startCall(lead)
        console.log("✅ startCall chamado! hasActiveCall agora:", hasActiveCall)
    }

    // ============================================
    // COMPUTED
    // ============================================

    const isDisabled = disabled || !lead.phone || hasActiveCall
    const tooltipText = !lead.phone
        ? "Lead sem telefone cadastrado"
        : hasActiveCall
            ? "Já existe uma ligação em andamento"
            : `Ligar para ${lead.phone}`

    // ============================================
    // RENDER
    // ============================================

    // Versão apenas ícone
    if (!showLabel || size === "icon") {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={variant}
                            size="icon"
                            onClick={handleClick}
                            disabled={isDisabled}
                            className={cn(
                                "h-8 w-8",
                                !isDisabled && "hover:bg-green-50 hover:text-green-600 hover:border-green-300",
                                className
                            )}
                        >
                            <Phone className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltipText}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    // Versão com texto
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={variant}
                        size={size}
                        onClick={handleClick}
                        disabled={isDisabled}
                        className={cn(
                            !isDisabled && "hover:bg-green-50 hover:text-green-600 hover:border-green-300",
                            className
                        )}
                    >
                        <Phone className="h-4 w-4 mr-2" />
                        Ligar
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}