// app/(crm)/layout.tsx

import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { WorkspaceProvider } from "@/contexts/workspace-context"
import { ActiveCallWrapper } from "@/components/calls/ActiveCallWrapper"
import { CommandPalette } from "@/components/layout/command-palette"
import { CrmHotkeys } from "@/components/layout/CrmHotkeys"
import { TrialBanner } from "@/components/crm/trial-banner"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedActiveDbUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
                                                  children,
                                              }: {
    children: React.ReactNode
}) {
    const user = await getAuthenticatedActiveDbUser()

    if (!user) {
        redirect("/sign-in")
    }

    // Buscar workspace para verificar trial
    const workspace = await prisma.workspace.findFirst({
        where: { userId: user.id },
        select: {
            id: true,
            plan: true,
            trialEndsAt: true,
            subscriptionStatus: true,
        }
    })

    // Se não tem workspace, redireciona para criar
    if (!workspace) {
        redirect("/workspaces?message=create-first")
    }

    // Verificar trial expirado
    if (workspace.plan === "TRIAL" && workspace.trialEndsAt) {
        if (new Date() > workspace.trialEndsAt) {
            redirect("/trial-expired")
        }
    }

    return (
        <WorkspaceProvider>
            <div className="flex h-screen flex-col bg-background">
                {/* Banner de Trial */}
                <TrialBanner />

                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <Header user={user} />
                        <main id="main-content" className="flex-1 overflow-y-auto bg-background p-5 md:p-6">
                            <div className="mb-4">
                                <Breadcrumbs />
                            </div>
                            {children}
                        </main>
                    </div>
                </div>
            </div>
            <CrmHotkeys />
            <ActiveCallWrapper />
            <CommandPalette />
        </WorkspaceProvider>
    )
}
