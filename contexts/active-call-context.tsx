// contexts/active-call-context.tsx

"use client"

import {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react"

// ============================================
// TYPES
// ============================================

export interface ActiveCallLead {
    id: string
    firstName: string
    lastName: string | null
    email: string
    phone: string | null
    company: string | null
}

interface ActiveCallState {
    isActive: boolean
    lead: ActiveCallLead | null
    startedAt: Date | null
    notes: string
}

interface ActiveCallContextType {
    /** Estado da ligação ativa */
    activeCall: ActiveCallState
    /** Inicia uma nova ligação */
    startCall: (lead: ActiveCallLead) => void
    /** Atualiza as notas durante a ligação */
    updateNotes: (notes: string) => void
    /** Encerra a ligação e retorna os dados */
    endCall: () => { lead: ActiveCallLead; startedAt: Date; notes: string } | null
    /** Cancela a ligação sem salvar */
    cancelCall: () => void
    /** Verifica se há ligação ativa */
    hasActiveCall: boolean
}

// ============================================
// CONTEXT
// ============================================

const ActiveCallContext = createContext<ActiveCallContextType | undefined>(
    undefined
)

// ============================================
// PROVIDER
// ============================================

interface ActiveCallProviderProps {
    children: ReactNode
}

export function ActiveCallProvider({ children }: ActiveCallProviderProps) {
    const [activeCall, setActiveCall] = useState<ActiveCallState>({
        isActive: false,
        lead: null,
        startedAt: null,
        notes: "",
    })

    const startCall = useCallback((lead: ActiveCallLead): void => {
        setActiveCall({
            isActive: true,
            lead,
            startedAt: new Date(),
            notes: "",
        })
    }, [])

    const updateNotes = useCallback((notes: string): void => {
        setActiveCall((prev) => ({
            ...prev,
            notes,
        }))
    }, [])

    const endCall = useCallback((): {
        lead: ActiveCallLead
        startedAt: Date
        notes: string
    } | null => {
        if (!activeCall.isActive || !activeCall.lead || !activeCall.startedAt) {
            return null
        }

        const callData = {
            lead: activeCall.lead,
            startedAt: activeCall.startedAt,
            notes: activeCall.notes,
        }

        // Limpa o estado
        setActiveCall({
            isActive: false,
            lead: null,
            startedAt: null,
            notes: "",
        })

        return callData
    }, [activeCall])

    const cancelCall = useCallback((): void => {
        setActiveCall({
            isActive: false,
            lead: null,
            startedAt: null,
            notes: "",
        })
    }, [])

    const value: ActiveCallContextType = {
        activeCall,
        startCall,
        updateNotes,
        endCall,
        cancelCall,
        hasActiveCall: activeCall.isActive,
    }

    return (
        <ActiveCallContext.Provider value={value}>
            {children}
        </ActiveCallContext.Provider>
    )
}

// ============================================
// HOOK
// ============================================

export function useActiveCall(): ActiveCallContextType {
    const context = useContext(ActiveCallContext)

    if (context === undefined) {
        throw new Error("useActiveCall must be used within an ActiveCallProvider")
    }

    return context
}