// app/(crm)/dashboard/page.tsx.bak
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"
import { getActiveOrFirstWorkspaceId } from "@/lib/workspace-selection"
import {
    getDashboardStats,
    getRecentCampaigns,
    getRecentLeads,
    getEmailsOverTime,
    getDashboardCallbacks,
    getDashboardGuidance,
} from "@/actions/dashboard"
import { DashboardClient } from "./dashboard-client"
import { DashboardSkeleton } from "./dashboard-skeleton"

// ============================================================
// DATA FETCHER
// ============================================================

async function DashboardData({ workspaceId }: { workspaceId: string }) {
    const [statsResult, campaignsResult, leadsResult, emailsResult, callbacksResult, guidanceResult] =
        await Promise.all([
            getDashboardStats(workspaceId),
            getRecentCampaigns(workspaceId),
            getRecentLeads(workspaceId),
            getEmailsOverTime(workspaceId),
            getDashboardCallbacks(workspaceId),
            getDashboardGuidance(workspaceId),
        ])

    return (
        <DashboardClient
            stats={statsResult.success ? statsResult.data! : null}
            campaigns={campaignsResult.success ? campaignsResult.data! : []}
            leads={leadsResult.success ? leadsResult.data! : []}
            emailsOverTime={emailsResult.success ? emailsResult.data! : []}
            callbacks={callbacksResult.success ? callbacksResult.data! : null}
            guidance={guidanceResult.success ? guidanceResult.data! : null}
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

    const workspaceId = await getActiveOrFirstWorkspaceId(user.id)
    if (!workspaceId) {
        redirect("/workspaces?message=create-first")
    }

    return (
        <div className="container py-6">
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardData workspaceId={workspaceId} />
            </Suspense>
        </div>
    )
}
