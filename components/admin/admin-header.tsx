"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ==================== CONFIGURAÇÕES POR VARIANTE ====================

const headerConfigs = {
    leadstore: {
        titleKey: "titleMarketplace",
        badgeColors: "bg-admin-soft text-admin border-admin-soft dark:bg-indigo-950 dark:text-admin dark:border-admin-soft",
        avatarColors: "bg-admin-soft text-admin dark:bg-indigo-900 dark:text-admin",
    },
    "super-admin": {
        titleKey: "title",
        badgeColors: "bg-[#e8eafe] text-[#3b3f82] border-[#cfd3fa] dark:bg-[#3b3f82]/30 dark:text-[#dfe2ff] dark:border-[#3b3f82]",
        avatarColors: "bg-[#e8eafe] text-[#3b3f82] dark:bg-[#3b3f82]/35 dark:text-[#dfe2ff]",
    },
}

// ==================== TIPOS ====================

type AdminVariant = keyof typeof headerConfigs

interface AdminHeaderProps {
    user?: {
        name?: string | null
        email?: string | null
    }
    variant?: AdminVariant
}

// ==================== COMPONENTE ====================

export function AdminHeader({ user, variant = "leadstore" }: AdminHeaderProps) {
    const t = useTranslations("admin.header")
    const { setTheme } = useTheme()
    const config = headerConfigs[variant]

    const initials = user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "A"

    return (
        <header className="flex h-16 items-center justify-between border-b border-border/80 bg-card/95 px-5 backdrop-blur md:px-6">
            <div className="flex items-center gap-4">
                <Badge variant="outline" className={cn(config.badgeColors)}>
                    {t("badge")}
                </Badge>
                <div className="hidden md:block">
                    <h1 className="text-base font-semibold">
                        {t(config.titleKey)}
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">{t("toggleTheme")}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            {t("light")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            {t("dark")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            {t("system")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-3">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium">{user?.name || "Admin"}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <Avatar>
                        <AvatarFallback className={cn(config.avatarColors)}>
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}
