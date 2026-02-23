// app/(dashboard)/settings/page.tsx
import { Suspense } from "react"
import { Metadata } from "next"
import { getUserProfile, getAccountStats } from "@/actions/settings"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"
import { SettingsClient } from "./settings-client"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
    title: "Configurações | AgencyCRM",
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
    const [profileResult, statsResult, user] = await Promise.all([
        getUserProfile(),
        getAccountStats(),
        getAuthenticatedUser(),
    ])

    const profile = profileResult.success ? profileResult.data! : null
    const stats = statsResult.success
        ? statsResult.data!
        : { leads: 0, campaigns: 0, templates: 0, calls: 0 }

    // Buscar primeiro workspace do usuário
    let workspaceId: string | undefined
    if (user) {
        const workspace = await prisma.workspace.findFirst({
            where: { userId: user.id },
            select: { id: true },
            orderBy: { createdAt: "asc" },
        })
        workspaceId = workspace?.id
    }

    return (
        <SettingsClient
            profile={profile}
            stats={stats}
            workspaceId={workspaceId}
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