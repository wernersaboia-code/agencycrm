// app/(dashboard)/deals/deals-client.tsx

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from "@dnd-kit/core"
import { Plus, List, LayoutGrid, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { PipelineColumn } from "./components/pipeline-column"
import { DealCard } from "./components/deal-card"
import { DealModal } from "@/components/deals/deal-modal"
import { getDealsWithStages, moveDealToStage, getDeals } from "@/actions/deals"

type Deal = {
    id: string
    title: string
    value?: unknown
    probability?: number | null
    expectedCloseDate?: Date | string | null
    description?: string | null
    stageId?: string | null
    contactId?: string | null
    companyId?: string | null
    status?: string
    contact?: { id: string; firstName: string; lastName: string } | null
    company?: { id: string; name: string } | null
    stage?: { id: string; name: string; color: string } | null
}

type Stage = {
    id: string
    name: string
    color: string
    order: number
}

type DealsClientProps = {
    initialStages: Stage[]
    initialDeals: Deal[]
}

export function DealsClient({ initialStages, initialDeals }: DealsClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [stages] = useState<Stage[]>(initialStages)
    const [deals, setDeals] = useState<Deal[]>(initialDeals)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
    const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
    const [statusFilter, setStatusFilter] = useState<string>("OPEN")

    // Configurar sensores do drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    // Filtrar deals por status
    const filteredDeals = statusFilter === "ALL"
        ? deals
        : deals.filter(deal => deal.status === statusFilter)

    // Agrupar deals por estágio
    const dealsByStage = stages.reduce((acc, stage) => {
        acc[stage.id] = filteredDeals.filter((deal) => deal.stageId === stage.id)
        return acc
    }, {} as Record<string, Deal[]>)

    // Helper para converter valor para number
    const toNumber = (value: unknown): number => {
        if (value === null || value === undefined) return 0
        return Number(value)
    }

    // Calcular totais
    const totalValue = filteredDeals.reduce((sum, deal) => sum + toNumber(deal.value), 0)
    const totalDeals = filteredDeals.length

    // Contagem por status
    const openDeals = deals.filter(d => d.status === "OPEN").length
    const wonDeals = deals.filter(d => d.status === "WON").length
    const lostDeals = deals.filter(d => d.status === "LOST").length

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    // Handlers
    const handleDragStart = (event: DragStartEvent) => {
        const deal = deals.find((d) => d.id === event.active.id)
        if (deal) {
            setActiveDeal(deal)
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveDeal(null)

        if (!over) return

        const dealId = active.id as string
        const newStageId = over.id as string

        // Encontrar o deal
        const deal = deals.find((d) => d.id === dealId)
        if (!deal || deal.stageId === newStageId) return

        // Só permite arrastar deals abertos
        if (deal.status !== "OPEN") {
            toast.error("Apenas deals abertos podem ser movidos")
            return
        }

        // Atualizar localmente (otimista)
        setDeals((prevDeals) =>
            prevDeals.map((d) =>
                d.id === dealId ? { ...d, stageId: newStageId } : d
            )
        )

        // Atualizar no servidor
        const result = await moveDealToStage(dealId, newStageId)

        if (!result.success) {
            // Reverter se falhar
            setDeals((prevDeals) =>
                prevDeals.map((d) =>
                    d.id === dealId ? { ...d, stageId: deal.stageId } : d
                )
            )
            toast.error("Erro ao mover deal")
        } else {
            toast.success("Deal movido com sucesso!")
        }
    }

    const handleDealClick = (deal: Deal) => {
        router.push(`/deals/${deal.id}`)
    }

    const handleCreate = () => {
        setSelectedDeal(null)
        setIsModalOpen(true)
    }

    const handleSuccess = () => {
        startTransition(async () => {
            const result = await getDeals(undefined, undefined)
            if (result.success && result.data) {
                setDeals(result.data as Deal[])
            }
        })
    }

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value)
        startTransition(async () => {
            if (value === "ALL") {
                const result = await getDeals()
                if (result.success) {
                    setDeals(result.data as Deal[])
                }
            } else {
                const result = await getDealsWithStages(value !== "OPEN")
                if (result.success && result.data) {
                    setDeals(result.data.deals as Deal[])
                }
            }
        })
    }

    const getStatusBadge = (status: string) => {
        switch(status) {
            case "WON": return <Badge variant="secondary" className="bg-green-100 text-green-800">Ganho</Badge>
            case "LOST": return <Badge variant="destructive">Perdido</Badge>
            default: return <Badge>Aberto</Badge>
        }
    }

    return (
        <>
            {/* Stats e Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4 flex-wrap">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Total em Pipeline</p>
                            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Deals</p>
                            <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold">{totalDeals}</p>
                                <div className="flex gap-1 text-xs">
                                    <span className="text-green-600">{wonDeals}W</span>
                                    <span className="text-red-600">{lostDeals}L</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Filtro de Status */}
                    <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                        <SelectTrigger className="w-[140px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="OPEN">Abertos</SelectItem>
                            <SelectItem value="WON">Ganhos</SelectItem>
                            <SelectItem value="LOST">Perdidos</SelectItem>
                            <SelectItem value="ALL">Todos</SelectItem>
                        </SelectContent>
                    </Select>

                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "kanban" | "list")}>
                        <TabsList>
                            <TabsTrigger value="kanban">
                                <LayoutGrid className="h-4 w-4" />
                            </TabsTrigger>
                            <TabsTrigger value="list">
                                <List className="h-4 w-4" />
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Deal
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            {viewMode === "kanban" ? (
                <div className="overflow-x-auto pb-4">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex gap-4 min-w-max">
                            {stages.map((stage) => (
                                <PipelineColumn
                                    key={stage.id}
                                    stage={stage}
                                    deals={dealsByStage[stage.id] || []}
                                    onDealClick={handleDealClick}
                                />
                            ))}
                        </div>

                        <DragOverlay>
                            {activeDeal && (
                                <div className="rotate-3 opacity-90">
                                    <DealCard deal={activeDeal} />
                                </div>
                            )}
                        </DragOverlay>
                    </DndContext>
                </div>
            ) : (
                // Vista de Lista
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-2">
                            {filteredDeals.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Nenhum deal encontrado
                                </p>
                            ) : (
                                filteredDeals.map((deal) => (
                                    <div
                                        key={deal.id}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                                        onClick={() => handleDealClick(deal)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: deal.stage?.color || "#6B7280" }}
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{deal.title}</p>
                                                    {deal.status && deal.status !== "OPEN" && getStatusBadge(deal.status)}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {deal.company?.name || deal.contact?.firstName || "Sem vínculo"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">
                                                {toNumber(deal.value) > 0 ? formatCurrency(toNumber(deal.value)) : "-"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {deal.stage?.name}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Modal */}
            <DealModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                deal={selectedDeal}
                stages={stages}
                onSuccess={handleSuccess}
            />
        </>
    )
}