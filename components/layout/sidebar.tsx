// components/layout/sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
import { toast } from "sonner"

const mainMenuItems = [
    {
        title: "Painel",
        href: "/dashboard",
        icon: LayoutDashboard,
        shortcut: "G D",
    },
    {
        title: "Leads",
        href: "/leads",
        icon: Users,
        shortcut: "G L",
    },
    {
        title: "Campanhas",
        href: "/campaigns",
        icon: Mail,
        shortcut: "G C",
    },
    {
        title: "Modelos de e-mail",
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

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async (): Promise<void> => {
        const supabase = createClient()
        await supabase.auth.signOut()
        toast.success("Logout realizado com sucesso!")
        router.push("/")
        router.refresh()
    }

    return (
        <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
            <div className="flex h-16 items-center border-b border-sidebar-border px-5">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary">
                        <span className="text-lg font-bold text-sidebar-primary-foreground">A</span>
                    </div>
                    <span className="text-lg font-bold tracking-normal">AgencyCRM</span>
                </Link>
            </div>

            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="flex flex-col gap-1">
                    <div className="mb-2">
                        <p className="mb-2 px-3 text-xs font-bold uppercase text-sidebar-foreground/55">
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
                                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                            : "text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.title}
                                    {item.shortcut && (
                                        <kbd className="ml-auto hidden text-[10px] text-sidebar-foreground/40 group-hover:inline-flex md:inline-flex items-center rounded border border-sidebar-border px-1.5 py-0.5 font-mono">
                                            {item.shortcut}
                                        </kbd>
                                    )}
                                </Link>
                            )
                        })}
                    </div>

                    <Separator className="my-2 bg-sidebar-border" />

                    <div className="mb-2">
                        <p className="mb-2 px-3 text-xs font-bold uppercase text-sidebar-foreground/55">
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
                                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                            : "text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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

            <div className="border-t border-sidebar-border p-3">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Sair
                </Button>
            </div>
        </div>
    )
}
