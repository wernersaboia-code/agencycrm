// components/leads/lead-source-badge.tsx

import { LeadSource } from "@prisma/client"
import {
    PenLine,
    Upload,
    ShoppingCart,
    Globe,
    Users,
    MoreHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LEAD_SOURCE_CONFIG } from "@/lib/constants/lead.constants"

const ICON_MAP = {
    PenLine,
    Upload,
    ShoppingCart,
    Globe,
    Users,
    MoreHorizontal,
} as const

interface LeadSourceBadgeProps {
    source: LeadSource
    showLabel?: boolean
    className?: string
}

export function LeadSourceBadge({
                                    source,
                                    showLabel = true,
                                    className
                                }: LeadSourceBadgeProps) {
    const config = LEAD_SOURCE_CONFIG[source]
    const Icon = ICON_MAP[config.icon as keyof typeof ICON_MAP] || MoreHorizontal

    return (
        <div className={cn("flex items-center gap-1.5 text-muted-foreground", className)}>
            <Icon className="h-3.5 w-3.5" />
            {showLabel && (
                <span className="text-xs">{config.label}</span>
            )}
        </div>
    )
}