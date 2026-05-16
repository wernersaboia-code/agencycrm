"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const EmptyIllustrations = {
    Leads: () => (
        <svg viewBox="0 0 200 120" className="h-32 w-48"><rect x="20" y="30" width="40" height="40" rx="20" fill="hsl(var(--muted))"/><rect x="70" y="20" width="40" height="50" rx="20" fill="hsl(var(--muted-foreground) / 0.15)"/><rect x="120" y="35" width="40" height="35" rx="17" fill="hsl(var(--muted-foreground) / 0.1)"/><circle cx="40" cy="95" r="12" fill="hsl(var(--muted))"/><circle cx="100" cy="100" r="10" fill="hsl(var(--muted-foreground) / 0.12)"/><circle cx="160" cy="92" r="14" fill="hsl(var(--muted-foreground) / 0.1)"/></svg>
    ),
    Campaigns: () => (
        <svg viewBox="0 0 200 120" className="h-32 w-48"><rect x="30" y="40" width="140" height="8" rx="4" fill="hsl(var(--muted))"/><rect x="30" y="56" width="110" height="8" rx="4" fill="hsl(var(--muted-foreground) / 0.1)"/><rect x="60" y="72" width="80" height="30" rx="6" fill="hsl(var(--muted-foreground) / 0.08)"/><path d="M40 85 L55 72 L70 82 L85 68 L100 78 L115 65 L130 75 L145 62 L160 72" fill="none" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="3" strokeLinecap="round"/></svg>
    ),
    Purchases: () => (
        <svg viewBox="0 0 200 120" className="h-32 w-48"><rect x="60" y="25" width="80" height="60" rx="6" fill="hsl(var(--muted))"/><rect x="70" y="35" width="60" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.2)"/><rect x="75" y="45" width="50" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.15)"/><rect x="80" y="55" width="40" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.1)"/><circle cx="60" cy="105" r="16" fill="hsl(var(--muted-foreground) / 0.08)"/><circle cx="100" cy="108" r="10" fill="hsl(var(--muted-foreground) / 0.06)"/></svg>
    ),
}

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
    illustration?: ReactNode
}

export function EmptyState({
                               icon: Icon,
                               title,
                               description,
                               primaryAction,
                               secondaryAction,
                               className,
                               illustration,
                           }: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-lg border bg-muted/20 px-6 py-12 text-center",
                className
            )}
        >
            {illustration ? (
                <div className="mb-4">{illustration}</div>
            ) : (
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
            )}
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
