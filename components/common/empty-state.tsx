"use client"

import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateAction {
    label: string
    onClick: () => void
    icon?: LucideIcon
    variant?: "default" | "outline" | "secondary" | "ghost"
}

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    primaryAction?: EmptyStateAction
    secondaryAction?: EmptyStateAction
    className?: string
}

export function EmptyState({
                               icon: Icon,
                               title,
                               description,
                               primaryAction,
                               secondaryAction,
                               className,
                           }: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-lg border bg-muted/20 px-6 py-12 text-center",
                className
            )}
        >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
                <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
            {(primaryAction || secondaryAction) && (
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    {primaryAction && (
                        <Button
                            variant={primaryAction.variant ?? "default"}
                            onClick={primaryAction.onClick}
                        >
                            {primaryAction.icon && <primaryAction.icon className="mr-2 h-4 w-4" />}
                            {primaryAction.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button
                            variant={secondaryAction.variant ?? "outline"}
                            onClick={secondaryAction.onClick}
                        >
                            {secondaryAction.icon && <secondaryAction.icon className="mr-2 h-4 w-4" />}
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
