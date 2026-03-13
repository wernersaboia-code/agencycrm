// components/admin/admin-header.tsx
"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface AdminHeaderProps {
    user?: {
        name?: string | null
        email?: string | null
    }
}

export function AdminHeader({ user }: AdminHeaderProps) {
    const { setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const initials = user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "A"

    return (
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Área Administrativa
                </Badge>
                <div className="hidden md:block">
                    <h1 className="text-lg font-semibold">
                        Gerenciamento do Marketplace
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {mounted ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Alternar tema</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setTheme("light")}>
                                Claro
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                                Escuro
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")}>
                                Sistema
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
                )}

                <div className="flex items-center gap-3">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium">{user?.name || "Admin"}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <Avatar>
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}