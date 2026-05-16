// app/super-admin/layout.tsx

import { redirect } from "next/navigation"
import { getAuthenticatedDbUser } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export default async function SuperAdminLayout({
                                                   children,
                                               }: {
    children: React.ReactNode
}) {
    const dbUser = await getAuthenticatedDbUser()

    if (!dbUser) {
        redirect("/sign-in")
    }

    if (dbUser.role !== "ADMIN" || dbUser.status !== "ACTIVE") {
        redirect("/dashboard")
    }

    return (
        <div className="flex h-screen bg-background">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeader
                    user={{ name: dbUser.name, email: dbUser.email }}
                    variant="super-admin"
                />
                <main id="main-content" className="flex-1 overflow-y-auto bg-background p-5 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
