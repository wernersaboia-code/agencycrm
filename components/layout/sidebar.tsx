// components/layout/sidebar.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
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
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const mainMenuItems = [
    {
        title: "Hoje",
        href: "/dashboard",
        icon: LayoutDashboard,
        shortcut: "G D",
    },
    {
        title: "Contatos",
        href: "/leads",
        icon: Users,
        shortcut: "G L",
    },
    {
        title: "Enviar e-mails",
        href: "/campaigns",
        icon: Mail,
        shortcut: "G C",
    },
    {
        title: "Textos prontos",
        href: "/templates",
        icon: FileText,
    },
    {
        title: "Retornos e ligações",
        href: "/calls",
        icon: Phone,
    },
    {
        title: "Resultados",
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
                    <Image src="/logo-icon.png" alt="" width={32} height={32} className="h-8 w-8 rounded-md" />
                    <div className="leading-tight">
                        <span className="block text-base font-bold tracking-normal">Easy Prospect</span>
                        <span className="block text-xs text-sidebar-foreground/60">CRM interno</span>
                    </div>
                </Link>
            </div>

            <div className="flex-1 overflow-y-scroll px-3 py-4 [scrollbar-gutter:stable]">
                <nav className="flex flex-col gap-1">
                    <div className="mb-2">
                        <p className="mb-2 px-3 text-xs font-bold uppercase text-sidebar-foreground/55">
                            Trabalho do dia
                        </p>
                        {mainMenuItems.map((item) => {
                            const isActive =
                                pathname === item.href || pathname.startsWith(item.href + "/")
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors",
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

                    <Separator className="my-2 bg-sidebar-border" />

                    <div className="mb-2">
                        <p className="mb-2 px-3 text-xs font-bold uppercase text-sidebar-foreground/55">
                            Administração
                        </p>
                        {managementMenuItems.map((item) => {
                            const isActive =
                                pathname === item.href || pathname.startsWith(item.href + "/")
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors",
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
            </div>

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
