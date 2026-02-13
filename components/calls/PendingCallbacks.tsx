// components/calls/PendingCallbacks.tsx

"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    AlertTriangle,
    Calendar,
    ChevronDown,
    ChevronUp,
    Clock,
    Phone,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { CallbacksSummary, PendingCallback } from "@/types/call.types"
import { SerializedCallWithLead } from "@/types/call.types"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface PendingCallbacksProps {
    callbacks: CallbacksSummary
    onCallbackClick: (call: SerializedCallWithLead) => void
}

interface CallbackGroupProps {
    title: string
    description: string
    icon: React.ReactNode
    callbacks: PendingCallback[]
    variant: "overdue" | "today" | "week" | "later"
    onCallbackClick: (call: SerializedCallWithLead) => void
    defaultOpen?: boolean
}

// ============================================
// CALLBACK ITEM
// ============================================

function CallbackItem({
                          callback,
                          onClick,
                      }: {
    callback: PendingCallback
    onClick: () => void
}) {
    const leadName = `${callback.lead.firstName} ${callback.lead.lastName || ""}`.trim()
    const followUpDate = callback.followUpAt ? new Date(callback.followUpAt) : null

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors text-left"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                    <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <p className="font-medium text-sm">{leadName}</p>
                    {callback.lead.company && (
                        <p className="text-xs text-muted-foreground">{callback.lead.company}</p>
                    )}
                </div>
            </div>
            {followUpDate && (
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                        {format(followUpDate, "HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {format(followUpDate, "dd/MM", { locale: ptBR })}
                    </p>
                </div>
            )}
        </button>
    )
}

// ============================================
// CALLBACK GROUP
// ============================================

function CallbackGroup({
                           title,
                           description,
                           icon,
                           callbacks,
                           variant,
                           onCallbackClick,
                           defaultOpen = false,
                       }: CallbackGroupProps) {
    const [isOpen, setIsOpen] = useState<boolean>(defaultOpen)

    if (callbacks.length === 0) return null

    const variantStyles = {
        overdue: "border-red-200 bg-red-50/50",
        today: "border-amber-200 bg-amber-50/50",
        week: "border-blue-200 bg-blue-50/50",
        later: "border-gray-200 bg-gray-50/50",
    }

    const badgeStyles = {
        overdue: "bg-red-100 text-red-700 border-red-200",
        today: "bg-amber-100 text-amber-700 border-amber-200",
        week: "bg-blue-100 text-blue-700 border-blue-200",
        later: "bg-gray-100 text-gray-700 border-gray-200",
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className={cn("border", variantStyles[variant])}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {icon}
                                <div>
                                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                                    <CardDescription className="text-xs">{description}</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={badgeStyles[variant]}>
                                    {callbacks.length}
                                </Badge>
                                {isOpen ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0 pb-3 space-y-2">
                        {callbacks.map((callback) => (
                            <CallbackItem
                                key={callback.id}
                                callback={callback}
                                onClick={() => onCallbackClick(callback as unknown as SerializedCallWithLead)}
                            />
                        ))}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PendingCallbacks({ callbacks, onCallbackClick }: PendingCallbacksProps) {
    const totalCount =
        callbacks.overdue.length +
        callbacks.today.length +
        callbacks.thisWeek.length +
        callbacks.later.length

    if (totalCount === 0) return null

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-medium">Callbacks Pendentes</h2>
                <Badge variant="secondary">{totalCount}</Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <CallbackGroup
                    title="Atrasados"
                    description="Precisam de atenção imediata"
                    icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                    callbacks={callbacks.overdue}
                    variant="overdue"
                    onCallbackClick={onCallbackClick}
                    defaultOpen={callbacks.overdue.length > 0}
                />

                <CallbackGroup
                    title="Hoje"
                    description="Callbacks para hoje"
                    icon={<Calendar className="h-5 w-5 text-amber-500" />}
                    callbacks={callbacks.today}
                    variant="today"
                    onCallbackClick={onCallbackClick}
                    defaultOpen={callbacks.overdue.length === 0 && callbacks.today.length > 0}
                />

                <CallbackGroup
                    title="Esta Semana"
                    description="Próximos 7 dias"
                    icon={<Calendar className="h-5 w-5 text-blue-500" />}
                    callbacks={callbacks.thisWeek}
                    variant="week"
                    onCallbackClick={onCallbackClick}
                />

                <CallbackGroup
                    title="Futuros"
                    description="Mais de 7 dias"
                    icon={<Calendar className="h-5 w-5 text-gray-500" />}
                    callbacks={callbacks.later}
                    variant="later"
                    onCallbackClick={onCallbackClick}
                />
            </div>
        </div>
    )
}