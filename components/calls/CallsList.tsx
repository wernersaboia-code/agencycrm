// components/calls/CallsList.tsx

"use client"

import { Phone, PhoneOff } from "lucide-react"
import { CallCard } from "./CallCard"
import { SerializedCallWithLead } from "@/types/call.types"
import { Skeleton } from "@/components/ui/skeleton"

// ============================================
// TYPES
// ============================================

interface CallsListProps {
    calls: SerializedCallWithLead[]
    isLoading: boolean
    onEdit: (call: SerializedCallWithLead) => void
    onDelete: (callId: string) => void
}

// ============================================
// LOADING SKELETON
// ============================================

function CallsListSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
        </div>
    )
}

// ============================================
// EMPTY STATE
// ============================================

function CallsListEmpty() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
                <PhoneOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Nenhuma ligação encontrada</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Registre sua primeira ligação clicando no botão "Nova Ligação" acima.
            </p>
        </div>
    )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CallsList({ calls, isLoading, onEdit, onDelete }: CallsListProps) {
    if (isLoading) {
        return <CallsListSkeleton />
    }

    if (calls.length === 0) {
        return <CallsListEmpty />
    }

    return (
        <div className="space-y-3">
            {/* Header da lista */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                <Phone className="h-4 w-4" />
                <span>
          {calls.length} {calls.length === 1 ? "ligação" : "ligações"}
        </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
                {calls.map((call) => (
                    <CallCard
                        key={call.id}
                        call={call}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    )
}