// components/calls/LeadCallsSection.tsx

"use client"

// ============================================
// IMPORTS
// ============================================
import { useState, useCallback } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    Phone,
    Plus,
    Clock,
    MessageSquare,
    Calendar,
    ChevronDown,
    ChevronUp,
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

import { CallResultBadge } from "./CallResultBadge"
import { CallModal } from "./CallModal"
import { deleteCall, getCallsByLead } from "@/actions/calls"
import { SerializedCallWithLead } from "@/types/call.types"
import {
    formatCallDuration,
    getCallResultConfig,
} from "@/lib/constants/call.constants"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface LeadCallsSectionProps {
    leadId: string
    leadName: string
    workspaceId: string
    initialCalls: SerializedCallWithLead[]
}

// ============================================
// COMPONENT
// ============================================

export function LeadCallsSection({
                                     leadId,
                                     leadName,
                                     workspaceId,
                                     initialCalls,
                                 }: LeadCallsSectionProps) {
    // ============================================
    // STATE
    // ============================================

    const [calls, setCalls] = useState<SerializedCallWithLead[]>(initialCalls)
    const [isExpanded, setIsExpanded] = useState<boolean>(initialCalls.length > 0)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [editingCall, setEditingCall] = useState<SerializedCallWithLead | null>(null)
    const [deletingCallId, setDeletingCallId] = useState<string | null>(null)

    // ============================================
    // HANDLERS
    // ============================================

    const handleRefreshCalls = useCallback(async (): Promise<void> => {
        const updatedCalls = await getCallsByLead(leadId)
        setCalls(updatedCalls)
    }, [leadId])

    const handleOpenModal = useCallback((): void => {
        setEditingCall(null)
        setIsModalOpen(true)
    }, [])

    const handleEditCall = useCallback((call: SerializedCallWithLead): void => {
        setEditingCall(call)
        setIsModalOpen(true)
    }, [])

    const handleCloseModal = useCallback((): void => {
        setIsModalOpen(false)
        setEditingCall(null)
    }, [])

    const handleCallSaved = useCallback(async (): Promise<void> => {
        handleCloseModal()
        await handleRefreshCalls()
        toast.success(editingCall ? "Ligação atualizada" : "Ligação registrada")
    }, [editingCall, handleCloseModal, handleRefreshCalls])

    const handleDeleteCall = useCallback(async (): Promise<void> => {
        if (!deletingCallId) return

        const result = await deleteCall(deletingCallId)

        if (result.success) {
            setCalls((prev) => prev.filter((c) => c.id !== deletingCallId))
            toast.success("Ligação excluída")
        } else {
            toast.error(result.error || "Erro ao excluir ligação")
        }

        setDeletingCallId(null)
    }, [deletingCallId])

    // ============================================
    // COMPUTED
    // ============================================

    const totalCalls = calls.length
    const lastCall = calls[0]
    const hasUpcomingCallback = calls.some(
        (call) => call.followUpAt && new Date(call.followUpAt) > new Date()
    )

    // ============================================
    // RENDER
    // ============================================

    return (
        <>
            <Card>
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CollapsibleTrigger asChild>
                                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-base">Ligações</CardTitle>
                                        <Badge variant="secondary" className="ml-1">
                                            {totalCalls}
                                        </Badge>
                                        {hasUpcomingCallback && (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Callback
                                            </Badge>
                                        )}
                                    </div>
                                    {isExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </button>
                            </CollapsibleTrigger>

                            <Button size="sm" onClick={handleOpenModal}>
                                <Plus className="h-4 w-4 mr-1" />
                                Nova
                            </Button>
                        </div>

                        {!isExpanded && lastCall && (
                            <CardDescription className="mt-2">
                                Última ligação:{" "}
                                {formatDistanceToNow(new Date(lastCall.calledAt), {
                                    addSuffix: true,
                                    locale: ptBR,
                                })}{" "}
                                • {getCallResultConfig(lastCall.result).label}
                            </CardDescription>
                        )}
                    </CardHeader>

                    <CollapsibleContent>
                        <CardContent className="pt-0">
                            {totalCalls === 0 ? (
                                <LeadCallsEmptyState onAddCall={handleOpenModal} />
                            ) : (
                                <LeadCallsTimeline
                                    calls={calls}
                                    onEdit={handleEditCall}
                                    onDelete={(id) => setDeletingCallId(id)}
                                />
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

            {/* Modal */}
            <CallModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSaved={handleCallSaved}
                call={editingCall}
                workspaceId={workspaceId}
                preselectedLeadId={leadId}
            />

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deletingCallId}
                onOpenChange={() => setDeletingCallId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir ligação?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O registro será removido
                            permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCall}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// ============================================
// SUBCOMPONENTS
// ============================================

function LeadCallsEmptyState({ onAddCall }: { onAddCall: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
                Nenhuma ligação registrada
            </p>
            <Button size="sm" variant="outline" onClick={onAddCall}>
                <Plus className="h-4 w-4 mr-1" />
                Registrar Primeira Ligação
            </Button>
        </div>
    )
}

function LeadCallsTimeline({
                               calls,
                               onEdit,
                               onDelete,
                           }: {
    calls: SerializedCallWithLead[]
    onEdit: (call: SerializedCallWithLead) => void
    onDelete: (id: string) => void
}) {
    return (
        <ScrollArea className="max-h-[400px] pr-4">
            <div className="relative">
                {/* Linha vertical da timeline */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

                <div className="space-y-4">
                    {calls.map((call, index) => (
                        <LeadCallTimelineItem
                            key={call.id}
                            call={call}
                            isFirst={index === 0}
                            onEdit={() => onEdit(call)}
                            onDelete={() => onDelete(call.id)}
                        />
                    ))}
                </div>
            </div>
        </ScrollArea>
    )
}

function LeadCallTimelineItem({
                                  call,
                                  isFirst,
                                  onEdit,
                                  onDelete,
                              }: {
    call: SerializedCallWithLead
    isFirst: boolean
    onEdit: () => void
    onDelete: () => void
}) {
    const config = getCallResultConfig(call.result)
    const Icon = config.icon
    const calledAtDate = new Date(call.calledAt)
    const followUpDate = call.followUpAt ? new Date(call.followUpAt) : null
    const isOverdue = followUpDate && followUpDate < new Date()
    const isPending = followUpDate && followUpDate > new Date()

    return (
        <div className="relative pl-10 group">
            {/* Ícone na timeline */}
            <div
                className={cn(
                    "absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
                    config.borderColor,
                    isFirst && "ring-2 ring-primary/20"
                )}
            >
                <Icon className={cn("h-4 w-4", config.color)} />
            </div>

            {/* Conteúdo */}
            <div
                className={cn(
                    "rounded-lg border p-3 transition-colors",
                    config.bgColor,
                    config.borderColor,
                    "hover:shadow-sm"
                )}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                        {/* Header: Badge + Data */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <CallResultBadge result={call.result} size="sm" showIcon={false} />
                            <span className="text-xs text-muted-foreground">
                {format(calledAtDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
                            {call.duration && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                                    {formatCallDuration(call.duration)}
                </span>
                            )}
                        </div>

                        {/* Notas */}
                        {call.notes && (
                            <div className="flex items-start gap-2 mt-2">
                                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground">{call.notes}</p>
                            </div>
                        )}

                        {/* Follow-up */}
                        {followUpDate && (
                            <div
                                className={cn(
                                    "flex items-center gap-2 mt-2 text-xs",
                                    isOverdue && "text-red-600 font-medium",
                                    isPending && "text-amber-600"
                                )}
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                  Retorno: {format(followUpDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    {isOverdue && " (atrasado)"}
                                    {isPending && " (pendente)"}
                </span>
                            </div>
                        )}
                    </div>

                    {/* Ações */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Ações</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={onDelete}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}