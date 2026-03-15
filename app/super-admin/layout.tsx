// app/super-admin/layout.tsx

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export default async function SuperAdminLayout({
                                                   children,
                                               }: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/sign-in")
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, name: true, email: true }
    })

    if (dbUser?.role !== "ADMIN") {
        redirect("/dashboard")
    }

    return (
        <div className="flex h-screen">
            <AdminSidebar variant="super-admin" />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeader
                    user={{ name: dbUser.name, email: dbUser.email }}
                    variant="super-admin"
                />
                <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
                    {children}
                </main>
            </div>
        </div>
    )
}