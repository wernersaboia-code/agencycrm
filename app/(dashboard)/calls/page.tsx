// app/(dashboard)/calls/page.tsx

import { Suspense } from "react"
import { cookies } from "next/headers"
import { getCalls, getCallStats, getPendingCallbacks } from "@/actions/calls"
import { CallsClient } from "./calls-client"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
    title: "Ligações | AgencyCRM",
    description: "Gerencie suas ligações e follow-ups",
}

async function CallsContent() {
    const cookieStore = await cookies()
    const workspaceId = cookieStore.get("activeWorkspaceId")?.value

    if (!workspaceId) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                    Selecione um workspace para ver as ligações
                </p>
            </div>
        )
    }

    const [calls, stats, callbacks] = await Promise.all([
        getCalls(workspaceId),
        getCallStats(workspaceId),
        getPendingCallbacks(workspaceId),
    ])

    return (
        <CallsClient
            initialCalls={calls}
            initialStats={stats}
            initialCallbacks={callbacks}
            workspaceId={workspaceId}
        />
    )
}

function CallsLoading() {
    return (
        <div className="space-y-6">
            {/* Stats skeleton */}
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
            </div>

            {/* Filters skeleton */}
            <Skeleton className="h-12 w-full rounded-lg" />

            {/* List skeleton */}
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
            </div>
        </div>
    )
}

export default function CallsPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <Suspense fallback={<CallsLoading />}>
                <CallsContent />
            </Suspense>
        </div>
    )
}