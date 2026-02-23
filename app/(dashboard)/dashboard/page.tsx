// app/(dashboard)/dashboard/page.tsx
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getAuthenticatedUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
    getDashboardStats,
    getRecentCampaigns,
    getRecentLeads,
    getEmailsOverTime,
    getDashboardCallbacks,
} from "@/actions/dashboard"
import { DashboardClient } from "./dashboard-client"
import { DashboardSkeleton } from "./dashboard-skeleton"

// ============================================================
// DATA FETCHER
// ============================================================

async function DashboardData({ workspaceId }: { workspaceId: string }) {
    const [statsResult, campaignsResult, leadsResult, emailsResult, callbacksResult] =
        await Promise.all([
            getDashboardStats(workspaceId),
            getRecentCampaigns(workspaceId),
            getRecentLeads(workspaceId),
            getEmailsOverTime(workspaceId),
            getDashboardCallbacks(workspaceId),
        ])

    return (
        <DashboardClient
            stats={statsResult.success ? statsResult.data! : null}
            campaigns={campaignsResult.success ? campaignsResult.data! : []}
            leads={leadsResult.success ? leadsResult.data! : []}
            emailsOverTime={emailsResult.success ? emailsResult.data! : []}
            callbacks={callbacksResult.success ? callbacksResult.data! : null}
        />
    )
}

// ============================================================
// PAGE
// ============================================================

export default async function DashboardPage() {
    const user = await getAuthenticatedUser()

    if (!user) {
        redirect("/sign-in")
    }

    // Tentar pegar workspace do cookie
    const cookieStore = await cookies()
    const activeWorkspaceId = cookieStore.get("activeWorkspaceId")?.value

    let workspaceId = activeWorkspaceId

    // Se não tiver cookie, buscar primeiro workspace
    if (!workspaceId) {
        const firstWorkspace = await prisma.workspace.findFirst({
            where: { userId: user.id },
            select: { id: true },
            orderBy: { createdAt: "asc" },
        })

        if (!firstWorkspace) {
            redirect("/workspaces?message=create-first")
        }

        workspaceId = firstWorkspace.id
    }

    return (
        <div className="container py-6">
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardData workspaceId={workspaceId} />
            </Suspense>
        </div>
    )
}