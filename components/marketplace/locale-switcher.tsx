"use client"

import { usePathname, useRouter } from "next/navigation"
import { Globe2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Páginas com par direto entre locales. Rotas sem par levam à home do outro locale.
const PT_TO_DE: Record<string, string> = {
    "/": "/de",
    "/faq": "/de/faq",
}

const DE_TO_PT: Record<string, string> = {
    "/de": "/",
    "/de/faq": "/faq",
}

export function LocaleSwitcher() {
    const locale = useLocale()
    const pathname = usePathname()
    const router = useRouter()
    const t = useTranslations("nav")

    const switchTo = (target: "pt" | "de") => {
        if (target === locale) return

        if (target === "de") {
            router.push(PT_TO_DE[pathname] ?? "/de")
        } else {
            router.push(DE_TO_PT[pathname] ?? "/")
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label={t("language")}>
                    <Globe2 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase">{locale}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => switchTo("pt")}
                    className={locale === "pt" ? "font-semibold" : ""}
                >
                    Português
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => switchTo("de")}
                    className={locale === "de" ? "font-semibold" : ""}
                >
                    Deutsch
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
