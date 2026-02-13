// app/(dashboard)/calls/calls-client.tsx

"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Phone, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { CallsList } from "@/components/calls/CallsList"
import { CallFilters } from "@/components/calls/CallFilters"
import { CallStats } from "@/components/calls/CallStats"
import { CallModal } from "@/components/calls/CallModal"
import { PendingCallbacks } from "@/components/calls/PendingCallbacks"

import { getCalls, getCallStats, getPendingCallbacks, deleteCall } from "@/actions/calls"
import { SerializedCallWithLead, CallbacksSummary } from "@/types/call.types"
import { CallResult } from "@prisma/client"

// ============================================
// TYPES
// ============================================

export interface CallFiltersState {
    search: string
    result: CallResult | "ALL"
    dateRange: "all" | "today" | "week" | "month" | "custom"
    dateFrom: string
    dateTo: string
}

interface CallsClientProps {
    initialCalls: SerializedCallWithLead[]
    initialStats: {
        total: number
        byResult: Record<CallResult, number>
        avgDuration: number
        pendingCallbacks: number
    }
    initialCallbacks: CallbacksSummary
    workspaceId: string
}

export interface CallFiltersState {
    search: string
    result: CallResult | "ALL"
    dateRange: "all" | "today" | "week" | "month" | "custom"
    dateFrom: string
    dateTo: string
}

// ============================================
// COMPONENT
// ============================================

export function CallsClient({
                                initialCalls,
                                initialStats,
                                initialCallbacks,
                                workspaceId,
                            }: CallsClientProps) {
    const router = useRouter()

    // ============================================
    // STATE
    // ============================================

    const [calls, setCalls] = useState<SerializedCallWithLead[]>(initialCalls)
    const [stats, setStats] = useState(initialStats)
    const [callbacks, setCallbacks] = useState<CallbacksSummary>(initialCallbacks)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [editingCall, setEditingCall] = useState<SerializedCallWithLead | null>(null)
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

    const [filters, setFilters] = useState<CallFiltersState>({
        search: "",
        result: "ALL",
        dateRange: "all",
        dateFrom: "",
        dateTo: "",
    })

    // ============================================
    // FILTERED DATA
    // ============================================

    const filteredCalls = useMemo(() => {
        return calls.filter((call) => {
            // Filtro de busca
            if (filters.search) {
                const searchLower = filters.search.toLowerCase()
                const leadName = `${call.lead.firstName} ${call.lead.lastName || ""}`.toLowerCase()
                const company = call.lead.company?.toLowerCase() || ""
                const notes = call.notes?.toLowerCase() || ""

                if (
                    !leadName.includes(searchLower) &&
                    !company.includes(searchLower) &&
                    !notes.includes(searchLower)
                ) {
                    return false
                }
            }

            // Filtro de resultado
            if (filters.result !== "ALL" && call.result !== filters.result) {
                return false
            }

            // Filtro de data
            if (filters.dateRange !== "all") {
                const callDate = new Date(call.calledAt)
                const now = new Date()
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

                switch (filters.dateRange) {
                    case "today":
                        if (callDate < todayStart) return false
                        break
                    case "week":
                        const weekAgo = new Date(todayStart)
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        if (callDate < weekAgo) return false
                        break
                    case "month":
                        const monthAgo = new Date(todayStart)
                        monthAgo.setMonth(monthAgo.getMonth() - 1)
                        if (callDate < monthAgo) return false
                        break
                    case "custom":
                        if (filters.dateFrom && callDate < new Date(filters.dateFrom)) return false
                        if (filters.dateTo && callDate > new Date(filters.dateTo)) return false
                        break
                }
            }

            return true
        })
    }, [calls, filters])

    // ============================================
    // HANDLERS
    // ============================================

    const handleRefresh = useCallback(async (): Promise<void> => {
        setIsLoading(true)
        try {
            const [newCalls, newStats, newCallbacks] = await Promise.all([
                getCalls(workspaceId),
                getCallStats(workspaceId),
                getPendingCallbacks(workspaceId),
            ])

            setCalls(newCalls)
            setStats(newStats)
            setCallbacks(newCallbacks)
            toast.success("Dados atualizados")
        } catch (error) {
            toast.error("Erro ao atualizar dados")
        } finally {
            setIsLoading(false)
        }
    }, [workspaceId])

    const handleOpenModal = useCallback((leadId?: string): void => {
        setEditingCall(null)
        setSelectedLeadId(leadId || null)
        setIsModalOpen(true)
    }, [])

    const handleEditCall = useCallback((call: SerializedCallWithLead): void => {
        setEditingCall(call)
        setSelectedLeadId(call.leadId)
        setIsModalOpen(true)
    }, [])

    const handleCloseModal = useCallback((): void => {
        setIsModalOpen(false)
        setEditingCall(null)
        setSelectedLeadId(null)
    }, [])

    const handleCallSaved = useCallback(async (): Promise<void> => {
        handleCloseModal()
        await handleRefresh()
        toast.success(editingCall ? "Ligação atualizada" : "Ligação registrada")
    }, [editingCall, handleCloseModal, handleRefresh])

    const handleDeleteCall = useCallback(
        async (callId: string): Promise<void> => {
            const result = await deleteCall(callId)

            if (result.success) {
                setCalls((prev) => prev.filter((c) => c.id !== callId))
                toast.success("Ligação excluída")
                // Atualiza stats
                const newStats = await getCallStats(workspaceId)
                setStats(newStats)
            } else {
                toast.error(result.error || "Erro ao excluir ligação")
            }
        },
        [workspaceId]
    )

    const handleFilterChange = useCallback(
        (newFilters: Partial<CallFiltersState>): void => {
            setFilters((prev) => ({ ...prev, ...newFilters }))
        },
        []
    )

    const handleCallbackClick = useCallback((call: SerializedCallWithLead): void => {
        handleEditCall(call)
    }, [handleEditCall])

    // ============================================
    // RENDER
    // ============================================

    const totalCallbacks =
        callbacks.overdue.length +
        callbacks.today.length +
        callbacks.thisWeek.length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Phone className="h-6 w-6" />
                        Ligações
                    </h1>
                    <p className="text-muted-foreground">
                        Registre e acompanhe suas ligações com leads
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Atualizar
                    </Button>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Ligação
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <CallStats stats={stats} />

            {/* Callbacks Pendentes */}
            {totalCallbacks > 0 && (
                <PendingCallbacks
                    callbacks={callbacks}
                    onCallbackClick={handleCallbackClick}
                />
            )}

            {/* Filters */}
            <CallFilters filters={filters} onFilterChange={handleFilterChange} />

            {/* Lista */}
            <CallsList
                calls={filteredCalls}
                isLoading={isLoading}
                onEdit={handleEditCall}
                onDelete={handleDeleteCall}
            />

            {/* Modal */}
            <CallModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSaved={handleCallSaved}
                call={editingCall}
                workspaceId={workspaceId}
                preselectedLeadId={selectedLeadId}
            />
        </div>
    )
}