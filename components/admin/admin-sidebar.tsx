// components/admin/admin-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    LayoutDashboard,
    Package,
    Users,
    Building2,
    ShoppingCart,
    Settings,
    LogOut,
    LifeBuoy,
    BarChart3,
    Store,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// ==================== CONFIGURAÇÃO DO MENU ====================

interface MenuItem {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    exact?: boolean
}

interface MenuSection {
    label: string
    items: MenuItem[]
}

const menuSections: MenuSection[] = [
    {
        label: "Visão Geral",
        items: [
            { title: "Dashboard", href: "/super-admin", icon: LayoutDashboard, exact: true },
        ],
    },
    {
        label: "Gestão",
        items: [
            { title: "Usuários", href: "/super-admin/users", icon: Users },
            { title: "Workspaces", href: "/super-admin/workspaces", icon: Building2 },
        ],
    },
    {
        label: "Marketplace",
        items: [
            { title: "Visão Geral", href: "/super-admin/marketplace", icon: Store, exact: true },
            { title: "Listas", href: "/super-admin/marketplace/lists", icon: Package },
            { title: "Vendas", href: "/super-admin/marketplace/purchases", icon: ShoppingCart },
        ],
    },
    {
        label: "Sistema",
        items: [
            { title: "Suporte", href: "/super-admin/support", icon: LifeBuoy },
            { title: "Analytics", href: "/super-admin/analytics", icon: BarChart3 },
            { title: "Configurações", href: "/super-admin/settings", icon: Settings },
        ],
    },
]

// ==================== COMPONENTE ====================

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

    const isItemActive = (href: string, exact?: boolean): boolean => {
        if (exact) return pathname === href
        return pathname === href || pathname.startsWith(href + "/")
    }

    return (
        <div className="flex h-full w-64 flex-col border-r bg-violet-950">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-violet-800 px-6">
                <Link href="/super-admin" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500">
                        <span className="text-lg font-bold text-white">A</span>
                    </div>
                    <div>
                        <span className="text-lg font-bold text-white">AgencyCRM</span>
                        <span className="block text-xs text-violet-400">Super Admin</span>
                    </div>
                </Link>
            </div>

            {/* Menu */}
            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="flex flex-col gap-1">
                    {menuSections.map((section, sectionIndex) => (
                        <div key={section.label} className="mb-2">
                            <p className="px-3 text-xs font-semibold uppercase tracking-wider mb-2 text-violet-400">
                                {section.label}
                            </p>

                            {section.items.map((item) => {
                                const isActive = isItemActive(item.href, item.exact)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-violet-500 text-white"
                                                : "text-violet-200 hover:bg-violet-800 hover:text-white"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.title}
                                    </Link>
                                )
                            })}

                            {sectionIndex < menuSections.length - 1 && (
                                <Separator className="my-3 bg-violet-800" />
                            )}
                        </div>
                    ))}
                </nav>
            </ScrollArea>

            {/* Logout */}
            <div className="border-t border-violet-800 p-3">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-violet-200 hover:bg-violet-800 hover:text-white"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Sair
                </Button>
            </div>
        </div>
    )
}