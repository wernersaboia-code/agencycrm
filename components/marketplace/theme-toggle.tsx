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

/**
 * O provider roda com `defaultTheme="system"`, então quem tem o SO no escuro já
 * recebe o tema escuro no marketplace — antes deste controle, sem nenhuma forma
 * de desfazer.
 */
export function ThemeToggle() {
    const { setTheme } = useTheme()
    const t = useTranslations("nav")

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("theme")}>
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden="true" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>{t("themeLight")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>{t("themeDark")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>{t("themeSystem")}</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
