// app/(dashboard)/settings/page.tsx
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getAuthenticatedUser } from "@/lib/auth"
import { getUserProfile, getAccountStats } from "@/actions/settings"
import { prisma } from "@/lib/prisma"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
    const user = await getAuthenticatedUser()

    if (!user) {
        redirect("/sign-in")
    }

    // Buscar workspace ativo
    const cookieStore = await cookies()
    const activeWorkspaceId = cookieStore.get("activeWorkspaceId")?.value

    if (!activeWorkspaceId) {
        redirect("/workspaces")
    }

    // Buscar dados completos do workspace
    const workspace = await prisma.workspace.findFirst({
        where: {
            id: activeWorkspaceId,
            userId: user.id,
        },
        select: {
            id: true,
            name: true,
            description: true,
            color: true,
            logo: true,
            senderName: true,
            senderEmail: true,
            smtpProvider: true,
            smtpHost: true,
            smtpPort: true,
            smtpUser: true,
            smtpPass: true,
            smtpSecure: true,
        },
    })

    if (!workspace) {
        redirect("/workspaces")
    }

    // Buscar perfil completo do usuário
    const profileResult = await getUserProfile()
    const profile = profileResult.success ? profileResult.data : null

    // Buscar stats
    const statsResult = await getAccountStats()
    const stats = statsResult.success && statsResult.data
        ? {
            totalLeads: statsResult.data.leads,
            totalCampaigns: statsResult.data.campaigns,
            totalTemplates: statsResult.data.templates,
            totalCalls: statsResult.data.calls,
        }
        : {
            totalLeads: 0,
            totalCampaigns: 0,
            totalTemplates: 0,
            totalCalls: 0,
        }

    return (
        <SettingsClient
            profile={profile ?? null}
            workspace={workspace}
            stats={stats}
        />
    )
}