"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

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
  compact?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  illustration,
  compact = false,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 text-center",
        compact ? "px-4 py-8" : "px-6 py-12 md:py-16",
        className
      )}
    >
      {illustration ? (
        <div className={cn("mb-4", compact ? "scale-75" : "")}>{illustration}</div>
      ) : (
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-full bg-indigo-50 shadow-sm",
            compact ? "h-10 w-10" : "h-12 w-12"
          )}
        >
          <Icon className={cn("text-indigo-600", compact ? "h-5 w-5" : "h-6 w-6")} />
        </div>
      )}
      <h3
        className={cn(
          "font-semibold text-card-foreground",
          compact ? "text-sm" : "text-lg"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "mt-1 text-muted-foreground",
          compact ? "max-w-xs text-xs" : "max-w-md text-sm"
        )}
      >
        {description}
      </p>
      {(primaryAction || secondaryAction) && (
        <div
          className={cn(
            "mt-5 flex flex-col gap-2 sm:flex-row",
            compact ? "mt-3" : "mt-5"
          )}
        >
          {primaryAction && (
            <Button
              variant={primaryAction.variant ?? "default"}
              size={compact ? "sm" : "default"}
              onClick={primaryAction.onClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {primaryAction.icon && (
                <primaryAction.icon className="mr-2 h-4 w-4" />
              )}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant ?? "outline"}
              size={compact ? "sm" : "default"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.icon && (
                <secondaryAction.icon className="mr-2 h-4 w-4" />
              )}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}
