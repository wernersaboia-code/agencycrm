// components/leads/lead-status-badge.tsx

import { Badge } from "@/components/ui/badge"
import { LeadStatus } from "@prisma/client"

const statusConfig: Record<
    LeadStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
> = {
    NEW: { label: "Novo", variant: "secondary" },
    CONTACTED: { label: "Contatado", variant: "default", className: "bg-blue-500" },
    OPENED: { label: "Abriu Email", variant: "default", className: "bg-blue-600" },
    CLICKED: { label: "Clicou", variant: "default", className: "bg-purple-500" },
    REPLIED: { label: "Respondeu", variant: "default", className: "bg-green-400" },
    CALLED: { label: "Ligação", variant: "default", className: "bg-orange-500" },
    INTERESTED: { label: "Interessado", variant: "default", className: "bg-green-500" },
    NOT_INTERESTED: { label: "Sem Interesse", variant: "destructive" },
    NEGOTIATING: { label: "Negociando", variant: "default", className: "bg-yellow-500" },
    CONVERTED: { label: "Convertido", variant: "default", className: "bg-green-600" },
    UNSUBSCRIBED: { label: "Descadastrado", variant: "outline" },
    BOUNCED: { label: "Email Inválido", variant: "destructive" },
}

interface LeadStatusBadgeProps {
    status: LeadStatus
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.NEW

    return (
        <Badge variant={config.variant} className={config.className}>
            {config.label}
        </Badge>
    )
}