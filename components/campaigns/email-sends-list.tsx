// components/campaigns/email-sends-list.tsx

"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    Mail,
    MailOpen,
    MousePointerClick,
    MessageSquare,
    AlertTriangle,
    Clock,
    CheckCircle,
    RefreshCw,
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { EmailSendDetails } from "@/actions/campaigns/metrics"

// ============================================
// TYPES
// ============================================

interface EmailSendsListProps {
    emailSends: EmailSendDetails[]
    isLoading?: boolean
    onRefresh?: () => void
}

// ============================================
// STATUS CONFIG
// ============================================

const STATUS_CONFIG: Record<string, {
    label: string
    icon: React.ReactNode
    className: string
}> = {
    PENDING: {
        label: "Pendente",
        icon: <Clock className="h-3.5 w-3.5" />,
        className: "bg-slate-100 text-slate-700",
    },
    SENT: {
        label: "Enviado",
        icon: <Mail className="h-3.5 w-3.5" />,
        className: "bg-blue-100 text-blue-700",
    },
    DELIVERED: {
        label: "Entregue",
        icon: <CheckCircle className="h-3.5 w-3.5" />,
        className: "bg-sky-100 text-sky-700",
    },
    OPENED: {
        label: "Aberto",
        icon: <MailOpen className="h-3.5 w-3.5" />,
        className: "bg-green-100 text-green-700",
    },
    CLICKED: {
        label: "Clicou",
        icon: <MousePointerClick className="h-3.5 w-3.5" />,
        className: "bg-purple-100 text-purple-700",
    },
    REPLIED: {
        label: "Respondeu",
        icon: <MessageSquare className="h-3.5 w-3.5" />,
        className: "bg-indigo-100 text-indigo-700",
    },
    BOUNCED: {
        label: "Bounce",
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        className: "bg-red-100 text-red-700",
    },
}

// ============================================
// HELPERS
// ============================================

function formatDate(date: string | null): string {
    if (!date) return "-"
    return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ptBR
    })
}

function getLeadName(lead: EmailSendDetails["lead"]): string {
    if (lead.firstName || lead.lastName) {
        return [lead.firstName, lead.lastName].filter(Boolean).join(" ")
    }
    return lead.email.split("@")[0]
}

// ============================================
// COMPONENT
// ============================================

export function EmailSendsList({
                                   emailSends,
                                   isLoading,
                                   onRefresh
                               }: EmailSendsListProps) {
    if (emailSends.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum email enviado ainda</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header com refresh */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {emailSends.length} destinatário{emailSends.length !== 1 ? "s" : ""}
                </p>
                {onRefresh && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn(
                            "h-4 w-4 mr-2",
                            isLoading && "animate-spin"
                        )} />
                        Atualizar
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Lead</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Enviado</TableHead>
                            <TableHead>Aberto</TableHead>
                            <TableHead>Clicou</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {emailSends.map((send: EmailSendDetails) => {
                            const statusConfig = STATUS_CONFIG[send.status] || STATUS_CONFIG.PENDING

                            return (
                                <TableRow key={send.id}>
                                    {/* Lead */}
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{getLeadName(send.lead)}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {send.lead.email}
                                            </p>
                                            {send.lead.company && (
                                                <p className="text-xs text-muted-foreground">
                                                    {send.lead.company}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={cn("gap-1", statusConfig.className)}
                                        >
                                            {statusConfig.icon}
                                            {statusConfig.label}
                                        </Badge>
                                        {send.bounceReason && (
                                            <p className="text-xs text-red-600 mt-1 max-w-[200px] truncate">
                                                {send.bounceReason}
                                            </p>
                                        )}
                                    </TableCell>

                                    {/* Sent */}
                                    <TableCell className="text-sm">
                                        {formatDate(send.sentAt)}
                                    </TableCell>

                                    {/* Opened */}
                                    <TableCell className="text-sm">
                                        {send.openedAt ? (
                                            <span className="text-green-600 font-medium">
                        {formatDate(send.openedAt)}
                      </span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>

                                    {/* Clicked */}
                                    <TableCell className="text-sm">
                                        {send.clickedAt ? (
                                            <span className="text-purple-600 font-medium">
                        {formatDate(send.clickedAt)}
                      </span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}