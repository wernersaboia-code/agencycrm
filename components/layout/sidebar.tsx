// components/layout/sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    Building2,
    Mail,
    FileText,
    Phone,
    BarChart3,
    Settings,
    LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// ============================================================
// CONFIGURAÇÃO DO MENU
// ============================================================

const mainMenuItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Leads",
        href: "/leads",
        icon: Users,
    },
    {
        title: "Campanhas",
        href: "/campaigns",
        icon: Mail,
    },
    {
        title: "Templates",
        href: "/templates",
        icon: FileText,
    },
    {
        title: "Ligações",
        href: "/calls",
        icon: Phone,
    },
    {
        title: "Relatórios",
        href: "/reports",
        icon: BarChart3,
    },
]

const managementMenuItems = [
    {
        title: "Clientes",
        href: "/workspaces",
        icon: Building2,
    },
    {
        title: "Configurações",
        href: "/settings",
        icon: Settings,
    },
]

// ============================================================
// COMPONENTE
// ============================================================

export function Sidebar() {
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
        <div className="flex h-full w-64 flex-col border-r bg-muted/40">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <span className="text-lg font-bold text-primary-foreground">A</span>
                    </div>
                    <span className="text-xl font-bold">AgencyCRM</span>
                </Link>
            </div>

            {/* Menu */}
            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="flex flex-col gap-1">
                    {/* Menu Principal */}
                    <div className="mb-2">
                        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Principal
                        </p>
                        {mainMenuItems.map((item) => {
                            const isActive =
                                pathname === item.href || pathname.startsWith(item.href + "/")
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.title}
                                </Link>
                            )
                        })}
                    </div>

                    <Separator className="my-2" />

                    {/* Gestão */}
                    <div className="mb-2">
                        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Gestão
                        </p>
                        {managementMenuItems.map((item) => {
                            const isActive =
                                pathname === item.href || pathname.startsWith(item.href + "/")
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.title}
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            </ScrollArea>

            {/* Logout */}
            <div className="border-t p-3">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Sair
                </Button>
            </div>
        </div>
    )
}