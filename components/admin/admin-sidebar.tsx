// components/admin/admin-sidebar.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
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
    FileText,
    ScrollText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// ==================== CONFIGURAÇÃO DO MENU ====================

interface MenuItem {
    titleKey: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    exact?: boolean
}

interface MenuSection {
    labelKey: string
    items: MenuItem[]
}

// ==================== COMPONENTE ====================

export function AdminSidebar() {
    const t = useTranslations("admin.sidebar")
    const tc = useTranslations("admin.common")
    const pathname = usePathname()
    const router = useRouter()

    const menuSections: MenuSection[] = [
        {
            labelKey: "sectionHome",
            items: [
                { titleKey: "dashboard", href: "/super-admin", icon: LayoutDashboard, exact: true },
            ],
        },
        {
            labelKey: "sectionAdmin",
            items: [
                { titleKey: "users", href: "/super-admin/users", icon: Users },
                { titleKey: "workspaces", href: "/super-admin/workspaces", icon: Building2 },
                { titleKey: "audit", href: "/super-admin/audit", icon: ScrollText },
            ],
        },
        {
            labelKey: "sectionLeadsSales",
            items: [
                { titleKey: "leadLists", href: "/super-admin/marketplace/lists", icon: Package },
                { titleKey: "sales", href: "/super-admin/marketplace/purchases", icon: ShoppingCart },
                { titleKey: "blog", href: "/super-admin/blog", icon: FileText },
            ],
        },
    ]

    const secondaryItems: MenuItem[] = [
        { titleKey: "support", href: "/super-admin/support", icon: LifeBuoy },
        { titleKey: "analytics", href: "/super-admin/analytics", icon: BarChart3 },
        { titleKey: "settings", href: "/super-admin/settings", icon: Settings },
    ]

    const handleLogout = async (): Promise<void> => {
        const supabase = createClient()
        await supabase.auth.signOut()
        toast.success(t("logoutSuccess"))
        router.push("/sign-in")
        router.refresh()
    }

    const isItemActive = (href: string, exact?: boolean): boolean => {
        if (exact) return pathname === href
        return pathname === href || pathname.startsWith(href + "/")
    }

    return (
        <div className="flex h-full w-64 flex-col border-r border-[#5559a0] bg-[#25285f]">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-[#5559a0] px-5">
                <Link href="/super-admin" className="flex items-center gap-2">
                    <Image src="/logo-icon.png" alt="" width={32} height={32} className="h-8 w-8 rounded-md" />
                    <div>
                        <span className="text-lg font-bold text-white">Easy Prospect</span>
                        <span className="block text-xs text-violet-400">{tc("area")}</span>
                    </div>
                </Link>
            </div>

            {/* Menu */}
            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="flex flex-col gap-1">
                    {menuSections.map((section, sectionIndex) => (
                        <div key={section.labelKey} className="mb-2">
                            <p className="mb-2 px-3 text-xs font-bold uppercase text-[#cfd3fa]/75">
                                {t(section.labelKey)}
                            </p>

                            {section.items.map((item) => {
                                const isActive = isItemActive(item.href, item.exact)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-[#e8eafe] text-[#25285f]"
                                                : "text-[#dfe2ff]/80 hover:bg-[#3b3f82] hover:text-white"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {t(item.titleKey)}
                                    </Link>
                                )
                            })}

                            {sectionIndex < menuSections.length - 1 && (
                                <Separator className="my-3 bg-[#5559a0]" />
                            )}
                        </div>
                    ))}
                </nav>
            </ScrollArea>

            <div className="border-t border-[#5559a0] p-3">
                <div className="mb-3 grid gap-1">
                    {secondaryItems.map((item) => {
                        const isActive = isItemActive(item.href, item.exact)

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                                    isActive
                                        ? "bg-[#e8eafe] text-[#25285f]"
                                        : "text-[#dfe2ff]/75 hover:bg-[#3b3f82] hover:text-white"
                                )}
                            >
                                <item.icon className="h-3.5 w-3.5" />
                                {t(item.titleKey)}
                            </Link>
                        )
                    })}
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-[#dfe2ff]/80 hover:bg-[#3b3f82] hover:text-white"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    {t("logout")}
                </Button>
            </div>
        </div>
    )
}
