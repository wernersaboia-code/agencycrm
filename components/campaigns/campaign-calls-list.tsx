// components/campaigns/campaign-calls-list.tsx

"use client"

// ============================================
// IMPORTS
// ============================================
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    Phone,
    PhoneOff,
    Clock,
    MessageSquare,
    User,
    Building2,
    Calendar,
    MoreHorizontal,
    Pencil,
    ExternalLink,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

import { CallResultBadge } from "@/components/calls/CallResultBadge"
import { SerializedCallWithLead } from "@/types/call.types"
import { formatCallDuration } from "@/lib/constants/call.constants"

// ============================================
// TYPES
// ============================================

interface CampaignCallsListProps {
    calls: SerializedCallWithLead[]
    isLoading: boolean
    onEdit: (call: SerializedCallWithLead) => void
    onRefresh: () => void
}

// ============================================
// LOADING SKELETON
// ============================================

function CampaignCallsListSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
        </div>
    )
}

// ============================================
// EMPTY STATE
// ============================================

function CampaignCallsListEmpty() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
                <PhoneOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Nenhuma ligação vinculada</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Registre ligações para esta campanha usando o botão "Nova Ligação" acima.
            </p>
        </div>
    )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CampaignCallsList({
                                      calls,
                                      isLoading,
                                      onEdit,
                                      onRefresh,
                                  }: CampaignCallsListProps) {
    const router = useRouter()

    if (isLoading) {
        return <CampaignCallsListSkeleton />
    }

    if (calls.length === 0) {
        return <CampaignCallsListEmpty />
    }

    const handleViewLead = (leadId: string): void => {
        router.push(`/leads/${leadId}`)
    }

    return (
        <TooltipProvider>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Lead</TableHead>
                            <TableHead>Resultado</TableHead>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Duração</TableHead>
                            <TableHead>Notas</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {calls.map((call) => {
                            const leadName = `${call.lead.firstName} ${call.lead.lastName || ""}`.trim()
                            const calledAtDate = new Date(call.calledAt)

                            return (
                                <TableRow key={call.id}>
                                    {/* Lead */}
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{leadName}</span>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    {call.lead.company && (
                                                        <>
                                                            <Building2 className="h-3 w-3" />
                                                            <span>{call.lead.company}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Resultado */}
                                    <TableCell>
                                        <CallResultBadge result={call.result} size="sm" />
                                    </TableCell>

                                    {/* Data/Hora */}
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger className="text-left">
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {formatDistanceToNow(calledAtDate, {
                                                        addSuffix: true,
                                                        locale: ptBR,
                                                    })}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {format(calledAtDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>

                                    {/* Duração */}
                                    <TableCell>
                                        {call.duration ? (
                                            <div className="flex items-center gap-1 text-sm">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                {formatCallDuration(call.duration)}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>

                                    {/* Notas */}
                                    <TableCell className="max-w-[200px]">
                                        {call.notes ? (
                                            <Tooltip>
                                                <TooltipTrigger className="text-left">
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {call.notes}
                                                    </p>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-[300px]">
                                                    <p className="whitespace-pre-wrap">{call.notes}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>

                                    {/* Ações */}
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Ações</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(call)}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleViewLead(call.leadId)}>
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Ver Lead
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>
          {calls.length} {calls.length === 1 ? "ligação" : "ligações"} vinculadas
        </span>
            </div>
        </TooltipProvider>
    )
}