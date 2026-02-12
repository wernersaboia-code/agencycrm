// app/(dashboard)/campaigns/components/EmailSendsList.tsx

"use client"

import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    Mail,
    MailOpen,
    MousePointerClick,
    AlertTriangle,
    Clock,
    CheckCircle,
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

// ============================================
// TYPES
// ============================================

interface EmailSend {
    id: string
    status: string
    sentAt: Date | string | null
    openedAt: Date | string | null
    clickedAt: Date | string | null
    bounceReason?: string | null
    lead: {
        id: string
        firstName: string | null
        lastName: string | null
        email: string
    }
}

interface EmailSendsListProps {
    emailSends: EmailSend[]
}

// ============================================
// STATUS CONFIG
// ============================================

const STATUS_CONFIG: Record<string, {
    label: string
    icon: React.ReactNode
    variant: "default" | "secondary" | "destructive" | "outline"
}> = {
    PENDING: {
        label: "Pendente",
        icon: <Clock className="h-3 w-3" />,
        variant: "secondary",
    },
    SENT: {
        label: "Enviado",
        icon: <Mail className="h-3 w-3" />,
        variant: "default",
    },
    DELIVERED: {
        label: "Entregue",
        icon: <CheckCircle className="h-3 w-3" />,
        variant: "default",
    },
    OPENED: {
        label: "Aberto",
        icon: <MailOpen className="h-3 w-3" />,
        variant: "default",
    },
    CLICKED: {
        label: "Clicado",
        icon: <MousePointerClick className="h-3 w-3" />,
        variant: "default",
    },
    BOUNCED: {
        label: "Bounce",
        icon: <AlertTriangle className="h-3 w-3" />,
        variant: "destructive",
    },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(date: Date | string | null): string {
    if (!date) return "-"
    const dateObj = typeof date === "string" ? new Date(date) : date
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR })
}

function getLeadName(lead: EmailSend["lead"]): string {
    if (lead.firstName || lead.lastName) {
        return [lead.firstName, lead.lastName].filter(Boolean).join(" ")
    }
    return lead.email
}

// ============================================
// COMPONENT
// ============================================

export function EmailSendsList({ emailSends }: EmailSendsListProps) {
    if (emailSends.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Nenhum email enviado ainda
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enviado</TableHead>
                        <TableHead>Aberto</TableHead>
                        <TableHead>Clicado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {emailSends.map((emailSend: EmailSend) => {
                        const status = STATUS_CONFIG[emailSend.status] || STATUS_CONFIG.PENDING

                        return (
                            <TableRow key={emailSend.id}>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{getLeadName(emailSend.lead)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {emailSend.lead.email}
                                        </p>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <Badge variant={status.variant} className="gap-1">
                                        {status.icon}
                                        {status.label}
                                    </Badge>
                                    {emailSend.bounceReason && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {emailSend.bounceReason}
                                        </p>
                                    )}
                                </TableCell>

                                <TableCell className="text-sm">
                                    {formatDate(emailSend.sentAt)}
                                </TableCell>

                                <TableCell className="text-sm">
                                    {emailSend.openedAt ? (
                                        <span className="text-green-600">
                      {formatDate(emailSend.openedAt)}
                    </span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>

                                <TableCell className="text-sm">
                                    {emailSend.clickedAt ? (
                                        <span className="text-purple-600">
                      {formatDate(emailSend.clickedAt)}
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
    )
}