// app/(dashboard)/campaigns/page.tsx

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"
import { getCampaigns } from "@/actions/campaigns"
import { getTemplates } from "@/actions/templates"
import { prisma } from "@/lib/prisma"
import { CampaignsClient } from "./campaigns-client"
import { Skeleton } from "@/components/ui/skeleton"

// ============================================================
// LOADING
// ============================================================

function CampaignsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
            </div>
        </div>
    )
}

// ============================================================
// DATA FETCHER
// ============================================================

async function CampaignsData({ workspaceId }: { workspaceId: string }) {
    const [campaignsResult, templatesResult] = await Promise.all([
        getCampaigns(workspaceId),
        getTemplates(workspaceId),
    ])

    if (!campaignsResult.success || !campaignsResult.data) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Erro ao carregar campanhas</p>
            </div>
        )
    }

    return (
        <CampaignsClient
            campaigns={campaignsResult.data}
            templates={templatesResult.data || []}
            workspaceId={workspaceId}
        />
    )
}

// ============================================================
// PAGE
// ============================================================

export default async function CampaignsPage() {
    const user = await getAuthenticatedUser()

    if (!user) {
        redirect("/sign-in")
    }

    // Buscar o primeiro workspace do usuário
    const firstWorkspace = await prisma.workspace.findFirst({
        where: { userId: user.id },
        select: { id: true },
        orderBy: { createdAt: "asc" },
    })

    if (!firstWorkspace) {
        redirect("/workspaces?message=create-first")
    }

    return (
        <div className="container py-6 space-y-6">
            <Suspense fallback={<CampaignsLoading />}>
                <CampaignsData workspaceId={firstWorkspace.id} />
            </Suspense>
        </div>
    )
}