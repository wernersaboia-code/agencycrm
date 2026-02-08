// app/(dashboard)/deals/components/pipeline-column.tsx

"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { DealCard } from "./deal-card"

type Deal = {
    id: string
    title: string
    value?: unknown
    probability?: number | null
    expectedCloseDate?: Date | string | null
    contact?: { id: string; firstName: string; lastName: string } | null
    company?: { id: string; name: string } | null
    stage?: { id: string; name: string; color: string } | null
    stageId?: string | null
}

type Stage = {
    id: string
    name: string
    color: string
    order: number
}

type PipelineColumnProps = {
    stage: Stage
    deals: Deal[]
    onDealClick: (deal: Deal) => void
}

export function PipelineColumn({ stage, deals, onDealClick }: PipelineColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: stage.id,
    })

    // Helper para converter valor para number
    const toNumber = (value: unknown): number => {
        if (value === null || value === undefined) return 0
        return Number(value)
    }

    // Calcular total do estágio
    const totalValue = deals.reduce((sum, deal) => {
        return sum + toNumber(deal.value)
    }, 0)

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    return (
        <div className="flex flex-col min-w-[300px] max-w-[300px]">
            {/* Header da coluna */}
            <div
                className="p-3 rounded-t-lg"
                style={{ backgroundColor: `${stage.color}20` }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stage.color }}
                        />
                        <h3 className="font-semibold text-sm">{stage.name}</h3>
                        <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
              {deals.length}
            </span>
                    </div>
                </div>
                {totalValue > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(totalValue)}
                    </p>
                )}
            </div>

            {/* Área de drop */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 p-2 space-y-2 bg-muted/30 rounded-b-lg min-h-[200px] transition-colors",
                    isOver && "bg-muted/60 ring-2 ring-primary ring-inset"
                )}
            >
                {deals.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                        Arraste deals para cá
                    </div>
                ) : (
                    deals.map((deal) => (
                        <DealCard
                            key={deal.id}
                            deal={deal}
                            onClick={() => onDealClick(deal)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}