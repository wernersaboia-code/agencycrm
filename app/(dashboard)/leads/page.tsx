// app/(dashboard)/leads/page.tsx

import { Suspense } from "react"
import { Metadata } from "next"
import { Users } from "lucide-react"
import { LeadsClient } from "./leads-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
    title: "Leads | AgencyCRM",
    description: "Gerencie seus leads de prospecção",
}

function LeadsLoading() {
    return (
        <div className="space-y-6">
            {/* Stats Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-8 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters Skeleton */}
            <div className="flex gap-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Table Skeleton */}
            <Card>
                <CardContent className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-6 w-20" />
                        </div>
                    ))}
                </CardContent>
            </Card>
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