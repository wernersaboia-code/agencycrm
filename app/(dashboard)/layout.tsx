// app/(dashboard)/layout.tsx

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { WorkspaceProvider } from "@/contexts/workspace-context"
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

    return (
        <WorkspaceProvider>
            <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header user={user} />
                    <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
                        {children}
                    </main>
                </div>
            </div>
        </WorkspaceProvider>
    )
}