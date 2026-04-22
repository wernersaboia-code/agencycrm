// app/(crm)/layout.tsx

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { WorkspaceProvider } from "@/contexts/workspace-context"
import { ActiveCallWrapper } from "@/components/calls/ActiveCallWrapper"
import { TrialBanner } from "@/components/crm/trial-banner"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
                                                  children,
                                              }: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
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
        redirect("/crm/sign-up")
    }

    // Verificar trial expirado
    if (workspace.plan === "TRIAL" && workspace.trialEndsAt) {
        if (new Date() > workspace.trialEndsAt) {
            redirect("/crm/trial-expired")
        }
    }

    return (
        <WorkspaceProvider>
            <div className="flex h-screen flex-col">
                {/* Banner de Trial */}
                <TrialBanner />

                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <Header user={user} />
                        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
            <ActiveCallWrapper />
        </WorkspaceProvider>
    )
}