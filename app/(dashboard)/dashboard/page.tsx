// app/(dashboard)/dashboard/page.tsx

import { Suspense } from "react"
import {
    getDashboardStats,
    getDealsByStage,
    getDealsOverTime,
    getUpcomingTasks,
    getRecentDeals
} from "@/actions/dashboard"
import { DashboardClient } from "./dashboard-client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

function DashboardLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

async function DashboardData() {
    const [statsResult, stagesResult, timeResult, tasksResult, dealsResult] = await Promise.all([
        getDashboardStats(),
        getDealsByStage(),
        getDealsOverTime(),
        getUpcomingTasks(),
        getRecentDeals(),
    ])

    const stats = statsResult.success ? statsResult.data! : {
        pipelineTotal: 0,
        pipelineCount: 0,
        wonThisMonth: 0,
        wonThisMonthCount: 0,
        lostThisMonth: 0,
        lostThisMonthCount: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        totalContacts: 0,
        totalCompanies: 0,
    }

    const dealsByStage = stagesResult.success ? stagesResult.data! : []
    const dealsOverTime = timeResult.success ? timeResult.data! : []
    const upcomingTasks = tasksResult.success ? tasksResult.data! : []
    const recentDeals = dealsResult.success ? dealsResult.data! : []

    return (
        <DashboardClient
            stats={stats}
            dealsByStage={dealsByStage}
            dealsOverTime={dealsOverTime}
            upcomingTasks={upcomingTasks}
            recentDeals={recentDeals}
        />
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <DashboardData />
        </Suspense>
    )
}