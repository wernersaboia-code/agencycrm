// app/(dashboard)/templates/page.tsx

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"
import { getTemplates } from "@/actions/templates"
import { prisma } from "@/lib/prisma"
import { TemplatesClient } from "./templates-client"
import { Skeleton } from "@/components/ui/skeleton"

// ============================================================
// LOADING
// ============================================================

function TemplatesLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
            </div>
        </div>
    )
}

// ============================================================
// DATA FETCHER
// ============================================================

async function TemplatesData({ workspaceId }: { workspaceId: string }) {
    const result = await getTemplates(workspaceId)

    if (!result.success || !result.data) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Erro ao carregar templates</p>
            </div>
        )
    }

    return <TemplatesClient templates={result.data} workspaceId={workspaceId} />
}

// ============================================================
// PAGE
// ============================================================

export default async function TemplatesPage() {
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
            <Suspense fallback={<TemplatesLoading />}>
                <TemplatesData workspaceId={firstWorkspace.id} />
            </Suspense>
        </div>
    )
}