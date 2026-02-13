// components/calls/CallCard.tsx

"use client"

import { useState } from "react"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Clock,
    Phone,
    Building2,
    Calendar,
    MessageSquare,
    User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { CallResultBadge } from "./CallResultBadge"
import { SerializedCallWithLead } from "@/types/call.types"
import { formatCallDuration, getCallResultConfig } from "@/lib/constants/call.constants"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface CallCardProps {
    call: SerializedCallWithLead
    onEdit: (call: SerializedCallWithLead) => void
    onDelete: (callId: string) => void
}

// ============================================
// COMPONENT
// ============================================

export function CallCard({ call, onEdit, onDelete }: CallCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false)

    const config = getCallResultConfig(call.result)
    const leadFullName = `${call.lead.firstName} ${call.lead.lastName || ""}`.trim()
    const calledAtDate = new Date(call.calledAt)
    const followUpDate = call.followUpAt ? new Date(call.followUpAt) : null

    const isOverdue = followUpDate && followUpDate < new Date()

    const handleDelete = (): void => {
        onDelete(call.id)
        setShowDeleteDialog(false)
    }

    return (
        <>
            <Card className={cn("transition-colors hover:bg-muted/30", config.borderColor)}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                        {/* Conteúdo principal */}
                        <div className="flex-1 min-w-0 space-y-2">
                            {/* Header: Nome + Badge */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <div className={cn("p-1.5 rounded-full", config.bgColor)}>
                                        <Phone className={cn("h-4 w-4", config.color)} />
                                    </div>
                                    <span className="font-medium truncate">{leadFullName}</span>
                                </div>
                                <CallResultBadge result={call.result} size="sm" />
                            </div>

                            {/* Informações do lead */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                {call.lead.company && (
                                    <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                                        {call.lead.company}
                  </span>
                                )}
                                {call.lead.phone && (
                                    <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                                        {call.lead.phone}
                  </span>
                                )}
                                {call.duration && (
                                    <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                                        {formatCallDuration(call.duration)}
                  </span>
                                )}
                            </div>

                            {/* Notas (se houver) */}
                            {call.notes && (
                                <div className="flex items-start gap-2 text-sm bg-muted/50 rounded-md p-2">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <p className="text-muted-foreground line-clamp-2">{call.notes}</p>
                                </div>
                            )}

                            {/* Footer: Data + Follow-up */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDistanceToNow(calledAtDate, {
                                                addSuffix: true,
                                                locale: ptBR,
                                            })}
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {format(calledAtDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                {followUpDate && (
                                    <span
                                        className={cn(
                                            "flex items-center gap-1",
                                            isOverdue && "text-red-500 font-medium"
                                        )}
                                    >
                    <Clock className="h-3 w-3" />
                    Retorno: {format(followUpDate, "dd/MM 'às' HH:mm", { locale: ptBR })}
                                        {isOverdue && " (atrasado)"}
                  </span>
                                )}
                            </div>
                        </div>

                        {/* Ações */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Ações</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(call)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setShowDeleteDialog(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog de confirmação */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir ligação?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O registro da ligação com{" "}
                            <strong>{leadFullName}</strong> será removido permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
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