"use client"

import { usePathname, useRouter } from "next/navigation"
import { Globe2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { setLocaleCookie } from "@/actions/locale"
import { localeTargetPath } from "@/lib/i18n/locale-routes"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LocaleSwitcher() {
    const locale = useLocale()
    const pathname = usePathname()
    const router = useRouter()
    const t = useTranslations("nav")

    const switchTo = async (target: "pt" | "de") => {
        if (target === locale) return

        await setLocaleCookie(target)

        const next = localeTargetPath(pathname, target)

        if (next === pathname) {
            // Mesma rota, conteúdo novo: só o refresh re-renderiza com o
            // cookie atualizado (um push para a rota atual seria no-op).
            router.refresh()
            return
        }

        router.push(next)
        router.refresh()
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
