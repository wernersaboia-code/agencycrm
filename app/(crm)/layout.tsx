// app/(crm)/layout.tsx

import { headers } from "next/headers"
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
import { isRotaDeEscapeDoWorkspace } from "@/lib/auth/workspace-guard"

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

    // O CRM é ferramenta interna da operação, não parte do produto vendido.
    // Antes bastava ter conta ativa: qualquer cliente que digitasse /dashboard
    // via leads, campanhas, chamadas e relatórios. `getAuthenticatedActiveDbUser`
    // confere `status`, nunca `role` — a checagem de papel precisa ser explícita.
    if (user.role !== "ADMIN") {
        redirect("/my-purchases")
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

    // /workspaces e /trial-expired moram dentro deste mesmo grupo de rotas,
    // então herdam este layout. Sem esta exceção, mandá-las para cá fazia o
    // layout rodar de novo, não achar workspace e redirecionar outra vez —
    // laço infinito, com a saída de emergência trancada por dentro.
    const pathname = (await headers()).get("x-pathname")
    const emRotaDeEscape = isRotaDeEscapeDoWorkspace(pathname)

    // Se não tem workspace, redireciona para criar
    if (!workspace && !emRotaDeEscape) {
        redirect("/workspaces?message=create-first")
    }

    // Verificar trial expirado
    if (workspace?.plan === "TRIAL" && workspace.trialEndsAt && !emRotaDeEscape) {
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
