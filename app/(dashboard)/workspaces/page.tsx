// app/(dashboard)/workspaces/page.tsx

import { Suspense } from "react"
import { Metadata } from "next"
import { Building2 } from "lucide-react"

import { getWorkspaces } from "@/actions/workspaces"
import { WorkspacesClient } from "./workspaces-client"

export const metadata: Metadata = {
    title: "Clientes | AgencyCRM",
    description: "Gerencie seus clientes",
}

async function WorkspacesData() {
    const result = await getWorkspaces()

    return <WorkspacesClient initialWorkspaces={result.data || []} />
}

function WorkspacesLoading() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Carregando clientes...</p>
            </div>
        </div>
    )
}

export default function WorkspacesPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <Building2 className="h-6 w-6" />
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                </div>
                <p className="text-muted-foreground mt-1">
                    Gerencie os clientes para quem você presta serviço
                </p>
            </div>

            {/* Conteúdo */}
            <Suspense fallback={<WorkspacesLoading />}>
                <WorkspacesData />
            </Suspense>
        </div>
    )
}