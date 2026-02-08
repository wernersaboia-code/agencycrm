// app/(dashboard)/deals/components/deal-card.tsx

"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Building2, User, Calendar, GripVertical } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Deal = {
    id: string
    title: string
    value?: unknown
    probability?: number | null
    expectedCloseDate?: Date | string | null
    contact?: { id: string; firstName: string; lastName: string } | null
    company?: { id: string; name: string } | null
    stage?: { id: string; name: string; color: string } | null
}

type DealCardProps = {
    deal: Deal
    onClick?: () => void
}

export function DealCard({ deal, onClick }: DealCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: deal.id,
        data: { deal },
    })

    const style = {
        transform: CSS.Translate.toString(transform),
    }

    // Helper para converter valor para number
    const toNumber = (value: unknown): number => {
        if (value === null || value === undefined) return 0
        return Number(value)
    }

    // Formatar valor como moeda
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    const dealValue = toNumber(deal.value)

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isDragging && "opacity-50 shadow-lg rotate-2"
            )}
            onClick={onClick}
        >
            <CardContent className="p-3">
                <div className="flex items-start gap-2">
                    {/* Handle para arrastar */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="mt-1 cursor-grab active:cursor-grabbing touch-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </button>

                    <div className="flex-1 min-w-0">
                        {/* Título */}
                        <h4 className="font-medium text-sm truncate">{deal.title}</h4>

                        {/* Valor */}
                        {dealValue > 0 && (
                            <p className="text-lg font-bold text-primary mt-1">
                                {formatCurrency(dealValue)}
                            </p>
                        )}

                        {/* Empresa e Contato */}
                        <div className="mt-2 space-y-1">
                            {deal.company && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Building2 className="h-3 w-3" />
                                    <span className="truncate">{deal.company.name}</span>
                                </div>
                            )}
                            {deal.contact && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span className="truncate">
                    {deal.contact.firstName} {deal.contact.lastName}
                  </span>
                                </div>
                            )}
                        </div>

                        {/* Footer: Data e Probabilidade */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t">
                            {deal.expectedCloseDate ? (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(deal.expectedCloseDate), "dd/MM", { locale: ptBR })}
                                </div>
                            ) : (
                                <div />
                            )}

                            {deal.probability !== null && deal.probability !== undefined && (
                                <div
                                    className={cn(
                                        "text-xs font-medium px-2 py-0.5 rounded-full",
                                        deal.probability >= 70 && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                                        deal.probability >= 40 && deal.probability < 70 && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                                        deal.probability < 40 && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                    )}
                                >
                                    {deal.probability}%
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}