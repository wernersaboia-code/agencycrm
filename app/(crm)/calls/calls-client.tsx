// app/(crm)/calls/calls-client.tsx

"use client"

import { useState, useCallback, useMemo } from "react"
import {
    AlertCircle,
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    Clock,
    Plus,
    Phone,
    RefreshCw,
    Target,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CallsList } from "@/components/calls/CallsList"
import { CallFilters } from "@/components/calls/CallFilters"
import { CallStats } from "@/components/calls/CallStats"
import { CallModal } from "@/components/calls/CallModal"
import { PendingCallbacks } from "@/components/calls/PendingCallbacks"

import { getCalls, getCallStats, getPendingCallbacks, deleteCall } from "@/actions/calls"
import { SerializedCallWithLead, CallbacksSummary } from "@/types/call.types"
import { ExportCallsButtons } from "@/components/reports/export-calls-buttons"
import { CallResult } from "@prisma/client"
import { CallsDashboard } from "@/components/calls/CallsDashboard"
import { cn } from "@/lib/utils"

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

// ============================================
// COMPONENT
// ============================================

export function CallsClient({
                                initialCalls,
                                initialStats,
                                initialCallbacks,
                                workspaceId,
                            }: CallsClientProps) {
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
    const [queueFilter, setQueueFilter] = useState<CallQueueFilter>("ALL")

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
            if (queueFilter === "CALLBACKS" && !call.followUpAt) {
                return false
            }

            if (
                queueFilter === "POSITIVE" &&
                !["INTERESTED", "CALLBACK", "MEETING_SCHEDULED"].includes(call.result)
            ) {
                return false
            }

            if (
                queueFilter === "ATTENTION" &&
                !["NO_ANSWER", "BUSY", "VOICEMAIL", "WRONG_NUMBER"].includes(call.result)
            ) {
                return false
            }

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
    }, [calls, filters, queueFilter])

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
        } catch {
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
    const totalCallbacksIncludingLater = totalCallbacks + callbacks.later.length
    const positiveCalls =
        (stats.byResult.INTERESTED || 0) +
        (stats.byResult.CALLBACK || 0) +
        (stats.byResult.MEETING_SCHEDULED || 0)
    const attentionCalls =
        (stats.byResult.NO_ANSWER || 0) +
        (stats.byResult.BUSY || 0) +
        (stats.byResult.VOICEMAIL || 0) +
        (stats.byResult.WRONG_NUMBER || 0)
    const actionProgress = Math.round(
        ((Number(stats.total > 0) + Number(positiveCalls > 0) + Number(totalCallbacksIncludingLater === 0)) / 3) * 100
    )
    const queueItems = [
        {
            label: "Callbacks",
            value: totalCallbacksIncludingLater,
            description: totalCallbacks > 0
                ? `${callbacks.overdue.length} atrasado${callbacks.overdue.length !== 1 ? "s" : ""}, ${callbacks.today.length} hoje.`
                : "Sem retornos urgentes agora.",
            icon: CalendarClock,
            filter: "CALLBACKS" as CallQueueFilter,
            tone: totalCallbacks > 0 ? "warning" : "success",
        },
        {
            label: "Resultados positivos",
            value: positiveCalls,
            description: "Interessados, retornos e reuniões agendadas.",
            icon: Target,
            filter: "POSITIVE" as CallQueueFilter,
            tone: positiveCalls > 0 ? "success" : "default",
        },
        {
            label: "Precisam atenção",
            value: attentionCalls,
            description: "Não atendeu, ocupado, caixa postal ou número errado.",
            icon: AlertCircle,
            filter: "ATTENTION" as CallQueueFilter,
            tone: attentionCalls > 0 ? "warning" : "success",
        },
    ]

    const hasActiveFilters =
        queueFilter !== "ALL" ||
        filters.search !== "" ||
        filters.result !== "ALL" ||
        filters.dateRange !== "all" ||
        filters.dateFrom !== "" ||
        filters.dateTo !== ""

    const clearAllFilters = () => {
        setQueueFilter("ALL")
        setFilters({
            search: "",
            result: "ALL",
            dateRange: "all",
            dateFrom: "",
            dateTo: "",
        })
    }

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
                    <ExportCallsButtons
                        workspaceId={workspaceId}
                        filters={{
                            result: filters.result !== "ALL" ? filters.result : undefined,
                            startDate: filters.dateFrom || undefined,
                            endDate: filters.dateTo || undefined,
                        }}
                    />
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Ligação
                    </Button>
                </div>
            </div>

            <Card className={totalCallbacks > 0 ? "border-amber-300 dark:border-amber-900" : "border-emerald-300 dark:border-emerald-900"}>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <CardTitle>Fila comercial</CardTitle>
                            <Badge variant={totalCallbacks > 0 ? "outline" : "default"}>
                                {totalCallbacks > 0 ? `${totalCallbacks} urgente${totalCallbacks !== 1 ? "s" : ""}` : "Em dia"}
                            </Badge>
                        </div>
                        <CardDescription>
                            Priorize retornos, resultados quentes e ligações que precisam de nova tentativa.
                        </CardDescription>
                    </div>
                    <div className="w-full space-y-2 lg:w-64">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Prontidão</span>
                            <span className="font-medium">{actionProgress}%</span>
                        </div>
                        <Progress value={actionProgress} />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                    {queueItems.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => setQueueFilter(queueFilter === item.filter ? "ALL" : item.filter)}
                            className={cn(
                                "flex min-h-[112px] items-start justify-between gap-3 rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted/50",
                                queueFilter === item.filter && "ring-2 ring-primary",
                                item.tone === "warning" && "border-amber-300 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20",
                                item.tone === "success" && "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                            )}
                        >
                            <span className="flex min-w-0 gap-3">
                                {item.tone === "success" ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                ) : (
                                    <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                                )}
                                <span className="space-y-1">
                                    <span className="block font-medium leading-tight">{item.label}</span>
                                    <span className="block text-2xl font-bold">{item.value}</span>
                                    <span className="block text-sm text-muted-foreground">{item.description}</span>
                                </span>
                            </span>
                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                    ))}
                </CardContent>
            </Card>

            {/* Stats */}
            <CallStats stats={stats} />

            {/* 🆕 Dashboard com Gráficos */}
            <CallsDashboard workspaceId={workspaceId} />

            {/* Callbacks Pendentes */}
            {totalCallbacks > 0 && (
                <PendingCallbacks
                    callbacks={callbacks}
                    onCallbackClick={handleCallbackClick}
                />
            )}

            {/* Filters */}
            <CallFilters filters={filters} onFilterChange={handleFilterChange} />

            {queueFilter !== "ALL" && (
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        Fila: {queueItems.find((item) => item.filter === queueFilter)?.label}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setQueueFilter("ALL")}>
                        Remover fila
                    </Button>
                </div>
            )}

            {/* Lista */}
            <CallsList
                calls={filteredCalls}
                isLoading={isLoading}
                onEdit={handleEditCall}
                onDelete={handleDeleteCall}
                onCreate={() => handleOpenModal()}
                onClearFilters={clearAllFilters}
                hasActiveFilters={hasActiveFilters}
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

type CallQueueFilter = "ALL" | "CALLBACKS" | "POSITIVE" | "ATTENTION"
