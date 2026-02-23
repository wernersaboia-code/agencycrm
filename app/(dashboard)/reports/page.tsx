// app/(dashboard)/reports/page.tsx
import { Suspense } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { FileText } from "lucide-react"
import { ReportsClient } from "./reports-client"
import { Skeleton } from "@/components/ui/skeleton"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth"

export const metadata = {
    title: "Relatórios | AgencyCRM",
    description: "Central de relatórios do AgencyCRM",
}

async function ReportsContent() {
    const user = await getAuthenticatedUser()

    if (!user) {
        redirect("/sign-in")
    }

    const cookieStore = await cookies()
    const workspaceId = cookieStore.get("activeWorkspaceId")?.value

    if (!workspaceId) {
        redirect("/workspaces")
    }

    // Verificar se workspace pertence ao usuário
    const workspace = await prisma.workspace.findFirst({
        where: { id: workspaceId, userId: user.id },
        select: {
            id: true,
            name: true,
            color: true,
            logo: true,
        },
    })

    if (!workspace) {
        redirect("/workspaces")
    }

    // Buscar campanhas para o filtro
    const campaigns = await prisma.campaign.findMany({
        where: { workspaceId },
        select: { id: true, name: true },
        orderBy: { createdAt: "desc" },
    })

    // Buscar estatísticas rápidas
    const [leadsCount, campaignsCount, callsCount, emailsSentCount] = await Promise.all([
        prisma.lead.count({ where: { workspaceId } }),
        prisma.campaign.count({ where: { workspaceId } }),
        prisma.call.count({ where: { workspaceId } }),
        prisma.emailSend.count({
            where: {
                campaign: { workspaceId },
                status: { not: "PENDING" },
            }
        }),
    ])

    return (
        <ReportsClient
            workspace={workspace}
            campaigns={campaigns}
            stats={{
                leads: leadsCount,
                campaigns: campaignsCount,
                calls: callsCount,
                emailsSent: emailsSentCount,
            }}
        />
    )
}

function ReportsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-48" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
            </div>
        </div>
    )
}

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <Suspense fallback={<ReportsLoading />}>
                <ReportsContent />
            </Suspense>
        </div>
    )
}