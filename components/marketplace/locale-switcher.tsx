"use client"

import { Globe2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/lib/i18n/navigation"
import { LOCALES, type Locale } from "@/lib/i18n/locales"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LocaleSwitcher() {
    const locale = useLocale()
    // usePathname do wrapper devolve o caminho SEM o prefixo de idioma, então
    // trocar de idioma é só re-renderizar a mesma rota no outro locale.
    const pathname = usePathname()
    const router = useRouter()
    const t = useTranslations("nav")

    const switchTo = (target: Locale) => {
        if (target === locale) return
        router.replace(pathname, { locale: target })
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
                {LOCALES.map((l) => (
                    <DropdownMenuItem key={l} onClick={() => switchTo(l)}>
                        {l.toUpperCase()}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
