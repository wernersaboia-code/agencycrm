// components/admin/admin-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingCart,
    Settings,
    LogOut,
    ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const adminMenuItems = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
    },
    {
        title: "Listas de Leads",
        href: "/admin/lists",
        icon: Package,
    },
    {
        title: "Vendas",
        href: "/admin/purchases",
        icon: ShoppingCart,
    },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async (): Promise<void> => {
        const supabase = createClient()
        await supabase.auth.signOut()
        toast.success("Logout realizado com sucesso!")
        router.push("/sign-in")
        router.refresh()
    }

    return (
        <div className="flex h-full w-64 flex-col border-r bg-emerald-950">
            {/* Logo Admin */}
            <div className="flex h-16 items-center border-b border-emerald-800 px-6">
                <Link href="/admin" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                        <span className="text-lg font-bold text-white">E</span>
                    </div>
                    <div>
                        <span className="text-lg font-bold text-white">Easy Prospect</span>
                        <span className="block text-xs text-emerald-400">Admin</span>
                    </div>
                </Link>
            </div>

            {/* Menu */}
            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="flex flex-col gap-1">
                    {/* Menu Admin */}
                    <div className="mb-2">
                        <p className="px-3 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                            Marketplace
                        </p>
                        {adminMenuItems.map((item) => {
                            const isActive = item.exact
                                ? pathname === item.href
                                : pathname === item.href || pathname.startsWith(item.href + "/")
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-emerald-500 text-white"
                                            : "text-emerald-200 hover:bg-emerald-800 hover:text-white"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.title}
                                </Link>
                            )
                        })}
                    </div>

                    <Separator className="my-2 bg-emerald-800" />

                    {/* Voltar para CRM */}
                    <div className="mb-2">
                        <p className="px-3 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                            Navegação
                        </p>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-800 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar ao CRM
                        </Link>
                    </div>
                </nav>
            </ScrollArea>

            {/* Logout */}
            <div className="border-t border-emerald-800 p-3">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-emerald-200 hover:text-white hover:bg-emerald-800"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Sair
                </Button>
            </div>
        </div>
    )
}