// components/calls/ActiveCallManager.tsx

"use client"

// ============================================
// IMPORTS
// ============================================
import { useState, useCallback } from "react"
import { toast } from "sonner"

import { ActiveCallModal } from "@/components/calls/ActiveCallModal"
import { CallModal } from "@/components/calls/CallModal"
import { useActiveCall, ActiveCallLead } from "@/contexts/active-call-context"
import { formatCallDuration } from "@/lib/constants/call.constants"

// ============================================
// TYPES
// ============================================

interface ActiveCallManagerProps {
    workspaceId: string
}

interface PendingCallData {
    lead: ActiveCallLead
    durationSeconds: number
    notes: string
    calledAt: Date
}

// ============================================
// COMPONENT
// ============================================

export function ActiveCallManager({ workspaceId }: ActiveCallManagerProps) {
    const { hasActiveCall } = useActiveCall()
    const [pendingCallData, setPendingCallData] = useState<PendingCallData | null>(null)
    const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false)

    // ============================================
    // HANDLERS
    // ============================================

    const handleEndCall = useCallback((data: PendingCallData): void => {
        // Guarda os dados e abre o modal de registro
        setPendingCallData(data)
        setIsCallModalOpen(true)

        toast.success(
            `Ligação encerrada: ${formatCallDuration(data.durationSeconds)}`,
            {
                description: "Complete o registro da ligação",
            }
        )
    }, [])

    const handleCancelActiveCall = useCallback((): void => {
        toast.info("Ligação cancelada")
    }, [])

    const handleCallSaved = useCallback((): void => {
        setIsCallModalOpen(false)
        setPendingCallData(null)
        toast.success("Ligação registrada com sucesso!")
    }, [])

    const handleCallModalClose = useCallback((): void => {
        // Se fechar sem salvar, pergunta se quer descartar
        if (pendingCallData) {
            const confirmed = window.confirm(
                "Deseja descartar o registro desta ligação?"
            )
            if (!confirmed) return
        }
        setIsCallModalOpen(false)
        setPendingCallData(null)
    }, [pendingCallData])

    // ============================================
    // RENDER
    // ============================================

    return (
        <>
            {/* Modal de Ligação Ativa (com Timer) */}
            {hasActiveCall && (
                <ActiveCallModal
                    onEndCall={handleEndCall}
                    onCancel={handleCancelActiveCall}
                />
            )}

            {/* Modal de Registro (após encerrar) */}
            {isCallModalOpen && pendingCallData && (
                <CallModal
                    isOpen={isCallModalOpen}
                    onClose={handleCallModalClose}
                    onSaved={handleCallSaved}
                    call={null}
                    workspaceId={workspaceId}
                    preselectedLeadId={pendingCallData.lead.id}
                    initialDuration={pendingCallData.durationSeconds}
                    initialNotes={pendingCallData.notes}
                    initialCalledAt={pendingCallData.calledAt}
                />
            )}
        </>
    )
}
