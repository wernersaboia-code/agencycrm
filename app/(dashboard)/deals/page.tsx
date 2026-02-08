// app/(dashboard)/deals/page.tsx

import { Suspense } from "react"
import { Metadata } from "next"
import { Briefcase } from "lucide-react"

import { getDeals, getPipelineStages } from "@/actions/deals"
import { DealsClient } from "./deals-client"

export const metadata: Metadata = {
    title: "Pipeline | NextCRM",
    description: "Gerencie seus deals",
}

async function DealsData() {
    // getPipelineStages agora cria os estágios automaticamente se não existirem
    const [stagesResult, dealsResult] = await Promise.all([
        getPipelineStages(),
        getDeals(),
    ])

    return (
        <DealsClient
            initialStages={stagesResult.data || []}
            initialDeals={dealsResult.data || []}
        />
    )
}

function DealsLoading() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Carregando pipeline...</p>
            </div>
        </div>
    )
}

export default function DealsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <Briefcase className="h-6 w-6" />
                    <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
                </div>
                <p className="text-muted-foreground mt-1">
                    Gerencie seus deals e acompanhe o funil de vendas
                </p>
            </div>

            {/* Conteúdo */}
            <Suspense fallback={<DealsLoading />}>
                <DealsData />
            </Suspense>
        </div>
    )
}