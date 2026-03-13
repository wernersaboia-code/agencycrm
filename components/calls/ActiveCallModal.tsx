// components/calls/ActiveCallModal.tsx

"use client"

// ============================================
// IMPORTS
// ============================================
import { useEffect } from "react"
import {
    Phone,
    PhoneOff,
    User,
    Building2,
    Mail,
    Clock,
    MessageSquare,
    X,
} from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import { useActiveCall, ActiveCallLead } from "@/contexts/active-call-context"
import { useCallTimer } from "@/hooks/useCallTimer"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface ActiveCallModalProps {
    /** Callback quando encerrar a ligação */
    onEndCall: (data: {
        lead: ActiveCallLead
        durationSeconds: number
        notes: string
        calledAt: Date
    }) => void
    /** Callback quando cancelar */
    onCancel?: () => void
}

// ============================================
// COMPONENT
// ============================================

export function ActiveCallModal({ onEndCall, onCancel }: ActiveCallModalProps) {
    const { activeCall, updateNotes, endCall, cancelCall, hasActiveCall } =
        useActiveCall()
    const timer = useCallTimer()

    // Inicia o timer quando o modal abre
    useEffect(() => {
        if (hasActiveCall && !timer.isRunning) {
            timer.start()
        }
    }, [hasActiveCall, timer])

    // ============================================
    // HANDLERS
    // ============================================

    const handleEndCall = (): void => {
        const durationSeconds = timer.stop()
        const callData = endCall()

        if (callData) {
            onEndCall({
                lead: callData.lead,
                durationSeconds,
                notes: callData.notes,
                calledAt: callData.startedAt,
            })
        }
    }

    const handleCancel = (): void => {
        timer.reset()
        cancelCall()
        onCancel?.()
    }

    const handleNotesChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>
    ): void => {
        updateNotes(e.target.value)
    }

    // ============================================
    // RENDER
    // ============================================

    if (!hasActiveCall || !activeCall.lead) {
        return null
    }

    const { lead } = activeCall

    return (
        <Dialog open={hasActiveCall} onOpenChange={() => {}}>
            <DialogContent
                className="sm:max-w-[450px]"
                // Desabilita fechar clicando fora ou ESC
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="relative">
                            <Phone className="h-5 w-5 text-green-600" />
                            <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        Ligação em Andamento
                    </DialogTitle>
                    <DialogDescription>
                        Anote informações importantes durante a conversa
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Timer Grande */}
                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                            <Clock className="h-5 w-5" />
                            <span className="text-sm font-medium">Duração</span>
                        </div>
                        <div
                            className={cn(
                                "text-5xl font-mono font-bold tracking-wider",
                                "text-green-700 dark:text-green-400"
                            )}
                        >
                            {timer.formattedTime}
                        </div>
                    </div>

                    {/* Informações do Lead */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">
                                    {lead.firstName} {lead.lastName}
                                </p>
                                {lead.company && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {lead.company}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-sm">
                            {lead.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span className="font-medium text-foreground">
                    {lead.phone}
                  </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span className="truncate">{lead.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Campo de Notas */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="call-notes"
                            className="flex items-center gap-2 text-sm font-medium"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Anotações da Ligação
                        </Label>
                        <Textarea
                            id="call-notes"
                            placeholder="Digite anotações enquanto conversa..."
                            className="min-h-[120px] resize-none"
                            value={activeCall.notes}
                            onChange={handleNotesChange}
                        />
                        <p className="text-xs text-muted-foreground">
                            {activeCall.notes.length}/2000 caracteres
                        </p>
                    </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleCancel}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={handleEndCall}
                    >
                        <PhoneOff className="h-4 w-4 mr-2" />
                        Encerrar Ligação
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}