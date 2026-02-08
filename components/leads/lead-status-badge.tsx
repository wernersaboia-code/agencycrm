// components/leads/lead-status-badge.tsx

import { LeadStatus } from "@prisma/client"
import { cn } from "@/lib/utils"
import { LEAD_STATUS_CONFIG } from "@/lib/constants/lead.constants"

interface LeadStatusBadgeProps {
    status: LeadStatus
    showDescription?: boolean
    className?: string
}

export function LeadStatusBadge({
                                    status,
                                    showDescription = false,
                                    className
                                }: LeadStatusBadgeProps) {
    const config = LEAD_STATUS_CONFIG[status]

    if (!config) {
        return (
            <span className="text-xs text-muted-foreground">
        {status}
      </span>
        )
    }

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
      <span
          className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              config.bgColor,
              config.textColor
          )}
      >
        {config.label}
      </span>
            {showDescription && (
                <span className="text-xs text-muted-foreground">
          {config.description}
        </span>
            )}
        </div>
    )
}