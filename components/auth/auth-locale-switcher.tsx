"use client"

import { Globe2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PUBLISHED_LOCALES, type Locale } from "@/lib/i18n/locales"
import { withLangParam } from "@/lib/i18n/auth-locale"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Seletor de idioma da auth. Diferente do LocaleSwitcher do site (que troca o
// prefixo da URL): aqui a auth vive fora de [locale], então o idioma é o
// parâmetro ?lang — trocar é reescrever a query preservando redirect/from.
export function AuthLocaleSwitcher() {
    const locale = useLocale()
    const t = useTranslations("auth")
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const switchTo = (target: Locale) => {
        if (target === locale) return
        const query = withLangParam(searchParams.toString(), target)
        router.replace(`${pathname}?${query}`)
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
                {PUBLISHED_LOCALES.map((l) => (
                    <DropdownMenuItem
                        key={l}
                        onClick={() => switchTo(l)}
                        className={l === locale ? "font-semibold" : undefined}
                    >
                        {l.toUpperCase()}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
