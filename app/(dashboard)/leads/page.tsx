// app/(dashboard)/leads/page.tsx

import { Suspense } from "react"
import { Metadata } from "next"
import { Users } from "lucide-react"
import { LeadsClient } from "./leads-client"

export const metadata: Metadata = {
    title: "Leads | AgencyCRM",
    description: "Gerencie seus leads",
}

function LeadsLoading() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Carregando leads...</p>
            </div>
        </div>
    )
}

export default function LeadsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                </div>
                <p className="text-muted-foreground mt-1">
                    Gerencie os leads do cliente selecionado
                </p>
            </div>

            {/* Conteúdo */}
            <Suspense fallback={<LeadsLoading />}>
                <LeadsClient />
            </Suspense>
        </div>
    )
}