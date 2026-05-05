// components/calls/CallsList.tsx

"use client"

import { Phone, PhoneOff, Plus, X } from "lucide-react"
import { CallCard } from "./CallCard"
import { SerializedCallWithLead } from "@/types/call.types"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/common/empty-state"

// ============================================
// TYPES
// ============================================

interface CallsListProps {
    calls: SerializedCallWithLead[]
    isLoading: boolean
    onEdit: (call: SerializedCallWithLead) => void
    onDelete: (callId: string) => void
    onCreate?: () => void
    onClearFilters?: () => void
    hasActiveFilters?: boolean
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

function CallsListEmpty({
                            hasActiveFilters,
                            onCreate,
                            onClearFilters,
                        }: {
    hasActiveFilters?: boolean
    onCreate?: () => void
    onClearFilters?: () => void
}) {
    return (
        <EmptyState
            icon={PhoneOff}
            title={hasActiveFilters ? "Nenhuma ligação encontrada" : "Nenhuma ligação registrada"}
            description={
                hasActiveFilters
                    ? "Ajuste os filtros para localizar ligações deste cliente."
                    : "Registre ligações para acompanhar respostas, callbacks e oportunidades em andamento."
            }
            primaryAction={
                hasActiveFilters && onClearFilters
                    ? {
                        label: "Limpar filtros",
                        icon: X,
                        variant: "outline",
                        onClick: onClearFilters,
                    }
                    : onCreate
                        ? {
                            label: "Registrar ligação",
                            icon: Plus,
                            onClick: onCreate,
                        }
                        : undefined
            }
        />
    )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CallsList({
                              calls,
                              isLoading,
                              onEdit,
                              onDelete,
                              onCreate,
                              onClearFilters,
                              hasActiveFilters,
                          }: CallsListProps) {
    if (isLoading) {
        return <CallsListSkeleton />
    }

    if (calls.length === 0) {
        return (
            <CallsListEmpty
                hasActiveFilters={hasActiveFilters}
                onCreate={onCreate}
                onClearFilters={onClearFilters}
            />
        )
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
