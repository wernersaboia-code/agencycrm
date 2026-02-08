// app/(dashboard)/settings/page.tsx

import { Suspense } from "react"
import { Metadata } from "next"
import { getUserProfile, getPipelineStagesForSettings, getAccountStats } from "@/actions/settings"
import { SettingsClient } from "./settings-client"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
    title: "Configurações | NextCRM",
}

function SettingsLoading() {
    return (
        <div className="space-y-6">
            <div>
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
            </div>
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        </div>
    )
}

async function SettingsData() {
    const [profileResult, stagesResult, statsResult] = await Promise.all([
        getUserProfile(),
        getPipelineStagesForSettings(),
        getAccountStats(),
    ])

    const profile = profileResult.success ? profileResult.data! : null
    const stages = stagesResult.success ? stagesResult.data! : []
    const stats = statsResult.success ? statsResult.data! : { contacts: 0, companies: 0, deals: 0, tasks: 0 }

    return (
        <SettingsClient
            profile={profile}
            stages={stages}
            stats={stats}
        />
    )
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<SettingsLoading />}>
            <SettingsData />
        </Suspense>
    )
}