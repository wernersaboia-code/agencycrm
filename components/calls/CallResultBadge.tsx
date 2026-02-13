// components/calls/CallResultBadge.tsx

"use client"

import { CallResult } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { getCallResultConfig } from "@/lib/constants/call.constants"
import { cn } from "@/lib/utils"

interface CallResultBadgeProps {
    result: CallResult
    showIcon?: boolean
    size?: "sm" | "default"
}

export function CallResultBadge({
                                    result,
                                    showIcon = true,
                                    size = "default",
                                }: CallResultBadgeProps) {
    const config = getCallResultConfig(result)
    const Icon = config.icon

    return (
        <Badge
            variant="outline"
            className={cn(
                config.bgColor,
                config.color,
                config.borderColor,
                "font-medium",
                size === "sm" && "text-xs px-2 py-0.5"
            )}
        >
            {showIcon && <Icon className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />}
            {config.label}
        </Badge>
    )
}